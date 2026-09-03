# Lucy 2.0 — Overlevering til Mathias

> **Til:** Mathias (AI-praktikant, Plutonic Media)
> **Fra:** Albert + Claude Code
> **Dato:** 2. september 2026
> **Repo:** `PlutonicMedia/lucyplutonic` — denne fil ligger på branchen `claude/lucy-plutonic-migration-fiuej0`

Dette dokument er hele overleveringen af Lucy-projektet. Det er skrevet, så du kan starte i morgen uden anden kontekst — og så din Claude Code-session også kan læse det og forstå projektet. Et godt første prompt i Claude Code er bogstaveligt talt:

> *"Læs OVERLEVERING-MATHIAS.md og giv mig et resumé. Så lægger vi en plan for i dag."*

---

## 1. Missionen

**Lucy** er Plutonics interne AI-billedgenererings-app. Den blev vibecodet i **Lovable** som et af Alberts første projekter, og flere kolleger bruger den stadig aktivt — men Plutonic har forladt Lovable som platform. Din opgave:

1. **Genskab Lucy som et selvstændigt projekt** drevet af Claude Code, med GitHub som hjem og **Netlify** som frontend-hosting — helt uden Lovable-afhængigheder.
2. **Fjern det der ikke virker** (der er features, som *ser ud* til at virke i UI'et, men reelt ikke gør noget — se afsnit 5, det er vigtigt).
3. **Tilføj det nye:** flere billedmodeller (bl.a. ChatGPT/OpenAI's billedmodel som synligt valg), cost-tracking, og på sigt agents og en feedback-funktion.
4. **Definér selv resten.** Du har stor kreativ frihed på features, UI og prioritering — afsnit 6 giver dig et discovery-oplæg, så den nye Lucy bliver bygget på, hvad kollegerne faktisk har brug for.

Vigtigste benspænd: **Den gamle Lucy skal blive ved med at virke, indtil den nye er live.** Kollegerne bruger den dagligt.

> ⚠️ **KRITISK: Rør aldrig `main` i dette repo.** Lovable har to-vejs-synk med `main` — den kørende Lucy bygges direkte af den branch. Pusher eller merger du noget til `main`, opdaterer du den app, kollegerne bruger lige nu. Alt arbejde i dette repo foregår på brancher (fx `claude/lucy-plutonic-migration-fiuej0`); den nye Lucy bygges i et separat, nyt repo. Sig det også til din Claude Code-session, så den ved det.

---

## 2. Hvad Lucy er i dag

### Funktioner (set fra brugeren)

- **Generér billeder** fra en tekstprompt — primært produkt-/modefotos til e-commerce-kunder.
- **Referencebilleder:** upload op til 5 billeder med hver sin beskrivelse ("modellen der bærer kjolen", "baggrundsscenen"), som modellen skal tage udgangspunkt i.
- **Carousel mode:** generér samme motiv i op til 5 forskellige miljøer (Studio, Outdoor, Urban, Lifestyle, Minimal) — til fx SoMe-karruseller.
- **Mapper/projekter:** billeder organiseres i mapper (typisk én pr. kunde/kampagne).
- **Prompt-bibliotek:** gem prompts globalt eller pr. projekt, og genbrug dem.
- **Galleri:** lightbox, multi-select, slet, download som zip.
- **Login:** e-mail/password via Supabase Auth. Hver bruger ser kun sine egne billeder.

### Stack og arkitektur

```
Browser (React 18 + Vite + TypeScript + Tailwind + shadcn/ui)
   │
   ├── Supabase Auth (login, sessions)
   ├── Supabase Postgres (folders, generated_images, saved_prompts, profiles — alt med RLS)
   ├── Supabase Storage (bucket: generated-images — OFFENTLIG, se kritik)
   └── Supabase Edge Function: generate-image (Deno)
          │
          └── ★ Lovable AI Gateway (ai.gateway.lovable.dev) ★
                ← DET HER ER DET ENESTE, DER BINDER OS TIL LOVABLE.
                Fallback-kæde: gemini-3-pro-image-preview
                             → gemini-3.1-flash-image-preview
                             → openai/gpt-image-2
```

- **Supabase-projekt:** `btnossbqgcefjzruahzw` (URL og anon key ligger i `.env` — anon key er offentlig by design, det er OK).
- Frontend hostes i dag af Lovable. Det skal flyttes til **Netlify**.
- `LOVABLE_API_KEY` ligger som secret i Supabase-projektet og betaler for al generering i dag.

### Kort over kodebasen (~500 linjer egen kode + shadcn)

| Fil | Hvad den gør |
|---|---|
| `src/pages/Index.tsx` | Hovedsiden. Indeholder også **genererings-loopet** (kalder edge-funktionen én gang pr. billede, sekventielt) |
| `src/components/layout/GenerationPanel.tsx` | Venstre panel: prompt, referencebilleder, aspect ratio, quality, format, carousel-toggle |
| `src/components/gallery/GalleryView.tsx` + `Lightbox.tsx` | Galleriet |
| `src/components/library/PromptLibrary.tsx` + `generation/PromptPicker.tsx` | Prompt-biblioteket |
| `src/components/layout/AppSidebar.tsx` | Mapper + navigation |
| `src/hooks/useImages.ts`, `useFolders.ts`, `usePrompts.ts` | Al data-hentning mod Supabase |
| `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`, `ResetPassword.tsx` | Login-flow |
| `src/integrations/supabase/client.ts` + `types.ts` | Supabase-klient + genererede DB-typer |
| `supabase/functions/generate-image/index.ts` | **Hele backend-hjernen** (300 linjer): auth-tjek, prompt-omskrivning, model-fallback, upload til storage, DB-insert, mappe-oprydning |
| `supabase/migrations/*.sql` | Databaseskemaet (læs dem — de er korte og fine) |

Databaseskemaet og RLS-policies er **gode** og kan genbruges. UI-strukturen er ren og kan i stort omfang genbruges. Det er backend-integrationen og en håndfuld halvfærdige features, der skal laves om.

---

## 3. Beslutninger der allerede er truffet (med Albert)

Disse er afklaret i en tidligere session — lav dem ikke om uden at vende det med Albert:

1. **Behold det eksisterende Supabase-projekt** (`btnossbqgcefjzruahzw`) som backend. Kollegernes logins, mapper og billeder skal overleve migreringen. Netlify hoster kun frontenden.
2. **Direkte API-nøgler i stedet for gateway:** Google (Gemini image) + OpenAI (gpt-image) kaldes direkte med Plutonics egne nøgler. Det giver fuld prisgennemsigtighed — en forudsætning for cost-tracking. (Vil du senere tilføje modeller som Flux/Ideogram, kan Replicate eller fal.ai bygges på som *ekstra* provider — men v1 er Google + OpenAI direkte.)
3. **V1-scope: paritet + modelvalg + costs.** Alt Lucy kan i dag, plus synligt modelvalg i UI, cost-tracking pr. billede, og fix af fejlene i afsnit 5. Agents og feedback-funktion er v2.
4. **Ny kodebase i et nyt repo.** Albert opretter et nyt, tomt GitHub-repo (navn ikke besluttet endnu — spørg ham) og giver din Claude-konto adgang. Dette gamle repo forbliver som reference/arkiv. *Indtil det nye repo findes, kan du arbejde her på branchen `claude/lucy-plutonic-migration-fiuej0` og flytte koden over bagefter.*

---

## 4. Kom i gang (dag 1-tjekliste)

1. **Adgang:** Sørg for at din Claude-konto har GitHub-adgang til `PlutonicMedia/lucyplutonic` (og det nye repo, når det findes). Adgang gives af en admin på claude.ai under GitHub-indstillingerne. Bed Albert, hvis noget er lukket.
2. **Klon og kør lokalt** (eller lad Claude Code gøre det):
   ```bash
   git clone https://github.com/PlutonicMedia/lucyplutonic.git
   cd lucyplutonic
   git checkout claude/lucy-plutonic-migration-fiuej0   # denne fil + evt. påbegyndt arbejde
   npm install
   npm run dev        # kører mod det rigtige Supabase-projekt via .env
   ```
   Log ind med din egen bruger (opret én via appens signup). **NB:** Genererings-knappen virker kun så længe Lovable-gatewayen svarer — resten af appen (mapper, galleri, prompts) kører rent på Supabase.
3. **Læs koden med Claude Code:** bed den gennemgå `supabase/functions/generate-image/index.ts` og `src/pages/Index.tsx` linje for linje med dig. Det er 80 % af forståelsen.
4. **Kør discovery** (afsnit 6) — snak med kollegerne der bruger Lucy, *før* du bygger.
5. **Læg din egen plan** med Claude Code (plan mode er godt til det) og vend den med Albert.

**Nøgler du skal bruge undervejs (bed Albert / find selv):**

| Hvad | Hvorfra | Hvornår |
|---|---|---|
| Google AI Studio API-nøgle | aistudio.google.com (Plutonic-konto) | Når du bygger den nye generator |
| OpenAI API-nøgle | platform.openai.com (Plutonic-konto) | Samme |
| Supabase-adgang (dashboard + CLI) | Albert inviterer dig til projektet | Dag 1-2 |
| Netlify-konto/team | Spørg Albert om der findes et Plutonic-team | Når frontenden skal deployes |

**API-nøgler må ALDRIG committes til Git.** De skal ligge som secrets i Supabase (`supabase secrets set GOOGLE_API_KEY=... OPENAI_API_KEY=...`), så kun edge-funktionen kan se dem. Frontend-koden må aldrig indeholde dem.

---

## 5. Kritik af den nuværende kode — det her skal fikses

Dette er resultatet af en fuld kodegennemgang. Punkterne under "Potemkin-features" er dem, Albert refererer til som *"funktioner der visuelt gav udtryk for at virke, men reelt ikke gjorde noget"*.

### 5a. Potemkin-features (UI lover noget, koden gør noget andet)

1. **Quality-vælgeren (1K/2K/4K) gør ingenting.** Værdien gemmes i databasen, men bruges aldrig i selve genereringen. OpenAI-stien er endda hardcodet til `size: "1024x1024", quality: "low"` — vælger brugeren "4K", får de 1K i lav kvalitet. *Fix: brug modellernes rigtige størrelses-/kvalitetsparametre, eller fjern vælgeren.*
2. **Format-vælgeren (PNG/JPG/WebP) omdøber kun filendelsen.** Billedbytes er PNG uanset hvad — en ".webp"-fil fra Lucy er en PNG med forkert navn og forkert `contentType`. *Fix: konvertér reelt (eller fjern valget).*
3. **Aspect ratio sendes kun som prosa i prompten** ("Aspect ratio: 9:16") i stedet for som API-parameter. Modellerne ignorerer det ofte. *Fix: brug de rigtige parametre (Gemini og OpenAI understøtter begge aspekt/størrelse direkte).*

### 5b. Reelle bugs og designfejl

4. **40-billeders-grænsen pr. mappe sletter i det stille** — og kun databaserækkerne, **ikke** filerne i storage. Konsekvens: brugernes ældste billeder "forsvinder" uden varsel, og der ophobes forældreløse filer, som koster storage-penge. *Fix: slet storage-filen sammen med rækken, og advar brugeren i stedet for at slette i smug (eller drop grænsen).*
5. **Referencebilleder sendes som base64 i JSON-payloaden** — 5 telefonbilleder sprænger nemt edge-funktionens grænser, og de samme megabytes gen-uploades for *hvert* billede i en batch. *Fix: upload referencer til storage én gang, send URL'er.*
6. **Genereringen kører sekventielt i browseren** (et for-loop i `Index.tsx`). 5 carousel-billeder = 5 serielle kald; lukker man fanen, dør batchen midt i. *Fix: parallelisér, eller flyt batch-logikken til backend.*
7. **Storage-bucketen er offentlig** (`getPublicUrl`) — alle med URL'en kan se billederne, selvom databasen har fin RLS. *Fix: privat bucket + signed URLs.*
8. **Skjult prompt-omskrivning:** en hardcodet dansk/engelsk ordliste ("lingeri", "badetøj", "bikini", …) omskriver prompten til en saniteret version, uden at brugeren får det at vide. Skør at vedligeholde, umulig at fejlsøge. *Fix: fjern listen; vis i stedet modellens egen afvisning transparent til brugeren, evt. med et "prøv omformuleret"-tilbud.*
9. **Ingen cost-tracking, og den faktiske model gemmes ikke.** Fallback-kæden betyder, at ingen ved, hvilken model der lavede et givet billede — eller hvad Lucy koster Plutonic. *Fix: se v1-designet i afsnit 7.*
10. **Fejl sluges:** hooks som `useImages` ignorerer Supabase-fejl (`const { data } = await query` — error tjekkes aldrig). Ting fejler bare stille.
11. **Småting:** testen er bogstaveligt talt `expect(true).toBe(true)`; 48 shadcn-komponenter hvoraf ~10 bruges; ubrugte dependencies (recharts, embla-carousel, vaul, input-otp, …); `lovable-tagger` i devDependencies skal ud; race condition i mappe-oprydningen ved samtidige genereringer.

### 5c. Det der er godt (genbrug det!)

- Databaseskemaet + RLS-policies (`supabase/migrations/`) — komplette og korrekte.
- Komponentstrukturen og hele UI-flowet — kollegerne kender og kan lide det.
- Idéerne bag carousel mode og referencebilleder — de skal med videre, bare implementeret ordentligt.

---

## 6. Din discovery-opgave: definér den nye Lucy

Du kender content-arbejdet bedre end nogen af os — brug det. **Inden du bygger features**, så tag en runde med de kolleger, der bruger Lucy i dag, og få svar på:

1. **Hvem bruger Lucy, og til hvilke kunder/opgaver?** (produktfotos? SoMe? annoncer? moodboards?)
2. **Hvad er det mest frustrerende ved den nuværende?** (hastighed? kvalitet? at billeder forsvinder? at prompts er svære?)
3. **Hvilke billedtyper fejler den på i dag?** (tekst i billeder? personer? bestemte produkter?)
4. **Hvilke modeller/værktøjer bruger de ved siden af Lucy** (Midjourney? Higgsfield? Canva?) — og hvorfor?
5. **Hvad ville få dem til at bruge Lucy MERE?** (flere modeller? video? upscaling? baggrunds-fjernelse? direkte eksport til Shopify/Meta?)
6. **Er der behov for deling på tværs af brugere?** (i dag er alt privat pr. bruger — skal team-mapper være en feature?)

Skriv svarene ned (fx i en `DISCOVERY.md` i det nye repo) — det bliver din kravspec, og Claude Code kan bruge den direkte.

**Din kreative frihed omfatter bl.a.:** valg og antal af billedmodeller (ud over de aftalte Gemini + gpt-image — fx Flux/Ideogram/Recraft via Replicate eller fal.ai som ekstra provider), UI-redesign, prompt-hjælper ("forbedr min prompt"-knap), team-features, eksport-integrationer, video-generering. Rammerne i afsnit 3 (Supabase, direkte nøgler, v1-scope) ligger dog fast.

---

## 7. Foreslået byggeplan

Dette er den plan, Albert har godkendt i overordnede træk. Du må justere rækkefølge og detaljer — men fase 2 (væk fra Lovable) er selve eksistensberettigelsen.

### Fase 1 — Fundament (nyt repo)
- Ny kodebase: Vite + React + TS + Tailwind + shadcn (samme stack — genbrug UI-komponenterne fra det gamle repo, men kun de shadcn-komponenter der faktisk bruges).
- Ingen Lovable-rester: drop `lovable-tagger`, `.lovable/`, gateway-koden.
- `netlify.toml` med SPA-redirect (`/* → /index.html 200`) + Netlify-site koblet på repoet (auto-deploy fra main, preview-deploys på PR'er).
- GitHub Actions: lint + typecheck + test på hver PR.
- En `CLAUDE.md` i roden, så alle fremtidige Claude Code-sessioner kender projektet (Claude Code kan generere den med `/init`).

### Fase 2 — Ny generator-backend (farvel Lovable)
- Omskriv `generate-image` edge-funktionen (samme Supabase-projekt — data røres ikke):
  - **Provider-lag** med to implementeringer: Google Gemini image API og OpenAI Images API, kaldt direkte med egne nøgler. *(Tjek de aktuelle modelnavne og priser i begge udbyderes docs, når du bygger — de skifter ofte. Claude Code kan slå det op for dig.)*
  - **Eksplicit modelvalg i UI** — brugeren vælger model; ingen skjult fallback. (Evt. et "auto"-valg der falder tilbage, men da skal den brugte model vises på billedet.)
  - Rigtige aspect ratio-/størrelses-/kvalitetsparametre → fixer kritikpunkt 1-3.
  - Referencebilleder via storage-upload + URL'er → fixer punkt 5.
  - Transparent fejlbesked når en model afviser en prompt → erstatter den skjulte ordliste (punkt 8).
- Skift gamle Lucys edge-funktion ud til sidst — eller kør den nye funktion under nyt navn parallelt, til den nye frontend er live.

### Fase 3 — Cost-tracking
- Migration: tilføj kolonner på `generated_images` (eller en `generations`-tabel): `model`, `provider`, `input_tokens`/`billed_unit`, `cost_usd`, `cost_dkk`.
- En lille prisliste pr. model i koden (opdaterbar ét sted) → beregn pris pr. billede ved generering.
- UI: pris pr. billede i galleriet + en "Forbrug"-side (pr. bruger / mappe / måned).

### Fase 4 — Oprydning og robusthed
- Privat bucket + signed URLs (punkt 7); storage-filer slettes sammen med DB-rækker (punkt 4); advarsel i stedet for stille sletning ved mappegrænse.
- Fejlhåndtering i alle hooks + brugbare toasts (punkt 10).
- Rigtige tests af de kritiske stier (generering, sletning, cost-beregning).
- Parallelle batch-kald (punkt 6).

### V2 — når v1 er i drift
- **Feedback-funktion:** thumbs up/down + kommentar pr. billede (ny tabel, klar til at bolte på).
- **Agents:** fx en prompt-forbedrings-agent via Claude API ("gør min prompt bedre til produktfoto"), eller en agent der genererer + kuraterer varianter selv.
- Flere modeller via Replicate/fal.ai, video, team-mapper — alt efter din discovery.

**Udrulning:** Byg den nye færdig → få 1-2 kolleger til at teste på Netlify-URL'en → flyt alle over → sluk den gamle Lovable-hosting. Ingen big bang.

---

## 8. Sådan arbejder du med Claude Code på det her (tips)

- **Start hver session med kontekst:** "Læs OVERLEVERING-MATHIAS.md (og CLAUDE.md/DISCOVERY.md når de findes)". Claude Code husker ikke på tværs af sessioner — filerne i repoet er hukommelsen.
- **Brug plan mode** til de store ting (fase 2!) — lad Claude foreslå en plan, læs den kritisk, godkend, og lad den så arbejde.
- **Små, hyppige commits og PR'er** — én fase-bid ad gangen, ikke "hele fase 2" i én PR. Så kan Albert (eller Claude selv med `/code-review`) reviewe med.
- **Lad Claude verificere:** bed den køre `npm run lint`, `npm run test` og starte appen og faktisk generere et billede, før noget merges.
- **Spørg løs:** "forklar hvad denne fil gør", "hvorfor er det her en dårlig idé?", "hvad koster et gpt-image-billede lige nu?" — det er en stor del af værdien.
- **Secrets-disciplin:** hvis Claude nogensinde foreslår at skrive en API-nøgle ind i en fil der committes — sig nej. Nøgler bor i Supabase secrets og i Netlifys env vars, ingen andre steder.

### Det du IKKE må
- ❌ Pushe eller merge noget til `main` i det gamle repo (`lucyplutonic`) — den branch er synket med Lovable og ER den kørende Lucy. Kun brancher.
- ❌ Slette eller "rydde op" i det eksisterende Supabase-projekt (der ligger kollegernes rigtige data).
- ❌ Ændre den gamle, kørende Lucys edge-funktion destruktivt, før den nye er testet og live.
- ❌ Committe API-nøgler eller `.env`-filer med hemmeligheder.
- ❌ Ændre på beslutningerne i afsnit 3 uden at vende det med Albert.

---

## 9. TL;DR — din første uge

1. **Dag 1:** Adgang på plads, kør appen lokalt, kodegennemgang med Claude Code, læs denne fil grundigt.
2. **Dag 1-3:** Discovery med kollegerne (afsnit 6) → skriv `DISCOVERY.md`. Albert opretter nyt repo + skaffer API-nøgler imens.
3. **Dag 3-5:** Fase 1 — nyt repo op at stå med genbrugt UI, Netlify-deploy af en fungerende skal (alt undtagen generering virker mod Supabase).
4. **Uge 2:** Fase 2 — den nye generator med Gemini + gpt-image og modelvalg i UI. Første rigtige billede genereret UDEN Lovable = milepæl 🎉
5. **Derefter:** costs, oprydning, test med kolleger, udrulning.

God fornøjelse — det er et taknemmeligt projekt: lille kodebase, tydelige fejl at fikse, rigtige brugere der glæder sig til en bedre Lucy.

*Spørgsmål undervejs: Albert (info@plutonic.dk).*
