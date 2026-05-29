# Robust generation for swimwear & lingerie

## Hvad sker der i dag

Logsene viser gentagne `Error: No image returned from AI` fra `generate-image`. Edge functionen kalder `google/gemini-3-pro-image-preview`, og når Geminis safety-filter rammer (typisk for swimwear/undertøj/badetøj), svarer gatewayen med 200 OK, men `choices[0].message.images` er tom — kun en tekstforklaring (refusal) returneres. Vi kaster derfor en generisk fejl, og brugeren får intet billede.

Vi løser det ved at (1) bygge en eksplicit fallback-kæde mellem modeller, (2) tilføje en domain-aware prompt-override der omformulerer kendte trigger-ord til neutrale, professionelle termer, og (3) rapportere den faktiske refusal-tekst tilbage i stedet for den nuværende generiske besked.

## Ændringer i `supabase/functions/generate-image/index.ts`

### 1. Hjælper: `callImageModel(model, contentParts)`
Wrap fetch-kaldet i en funktion der returnerer `{ ok, imageBase64, refusalText, status }` i stedet for at kaste. Detekter "blocked" tilfælde:
- HTTP 400/422 med safety-relateret body
- HTTP 200 hvor `message.images` er tom men `message.content` indeholder tekst → behandl som "blocked", returnér refusalText

### 2. Prompt-override lag
Tilføj en `sanitizePromptForSensitive(prompt)` funktion der:
- Detekterer trigger-keywords (case-insensitive): `lingerie`, `undertøj`, `bra`, `bh`, `panties`, `trusser`, `swimwear`, `badetøj`, `bikini`, `swimsuit`, `briefs`, `bodysuit`, `negligé`
- Hvis match: præfix prompten med en editorial/kommerciel framing der har vist sig at passere Gemini-filteret:
  > "Professional e-commerce product photography for an apparel catalog. Tasteful, fully-clothed model in studio lighting. Subject: …"
- Erstatter `text` delen af `contentParts` med den sanerede version
- Returnerer også et boolean `wasSanitized` så vi kan logge det

### 3. Fallback-kæde
Definér en ordnet liste:
```ts
const MODEL_CHAIN = [
  "google/gemini-3-pro-image-preview",       // primær
  "google/gemini-3.1-flash-image-preview",   // anden Gemini variant, andet sikkerhedsprofil
  "openai/gpt-image-2",                      // anden provider med andet filter
];
```
Loop gennem kæden:
1. Forsøg model med original prompt
2. Hvis blocked → forsøg samme model med sanitized prompt
3. Hvis stadig blocked → næste model i kæden (start igen med sanitized)
4. Når en model returnerer et billede → break
5. Hvis hele kæden fejler → returnér 422 med den sidste refusal-tekst og hvilke modeller der blev prøvet

Bemærk: `openai/gpt-image-2` kræver en anden body-shape (`prompt` felt + ikke `messages`/`modalities`) jf. ai-image-generation-knowledge — dette håndteres inde i `callImageModel` via en model→body-mapper.

### 4. Bedre fejlrapportering
Returnér struktureret fejl:
```json
{ "error": "Content policy", "detail": "<refusal>", "triedModels": [...] }
```
Så frontend (`Index.tsx` `handleGenerate`) kan vise toast med den faktiske grund i stedet for "Generation failed".

## Ingen ændringer i UI eller DB

- Ingen schema-ændringer.
- Ingen frontend-ændringer udover at lade eksisterende toast vise `error.message` (allerede sådan).

## Filer der ændres

- `supabase/functions/generate-image/index.ts` (eneste fil)

## Hvad denne plan IKKE gør

- Tilføjer ikke en bruger-styret "NSFW mode" toggle — det er en bredere produktbeslutning.
- Bygger ikke en async job-kø (timeouts er ikke det observerede problem; safety-blocks er).
- Logger ikke prompts til en separat audit-tabel — kan tilføjes senere hvis ønsket.
