# Carousel Mode — Style Variants Across Environments

## What it does

Add a new **Carousel** toggle to the Generation panel. When enabled, instead of generating N identical-prompt outputs, Lucy generates **up to 5 variants** of the same subject/style placed in **different environments** (e.g. studio, outdoor sunlight, urban street, indoor lifestyle, minimalist set).

Each variant is saved as a separate image in the active folder, tagged so the gallery can show them as a related set.

## UI changes (`GenerationPanel.tsx`)

- New section above **Outputs**: a toggle "Carousel mode" with helper text "Generate variants in different environments".
- When ON:
  - Hide the existing **Outputs** slider.
  - Show a small slider/stepper "Variants" (1–5, default 3).
  - Show a compact, editable list of environment presets (chips): `Studio`, `Outdoor`, `Urban`, `Lifestyle`, `Minimal`. User can deselect chips; the first N selected drive the variants.
- When OFF: panel behaves exactly as today.

## Generation flow (`Index.tsx` → `handleGenerate`)

- Extend `GenerationConfig` with `carousel?: { enabled: boolean; environments: string[] }`.
- If `carousel.enabled`:
  - Loop over the selected environments (max 5).
  - For each, build a per-call prompt: `${prompt} — set in ${environment description}, same subject and styling, consistent lighting and wardrobe`.
  - Send a `carouselGroupId` (uuid generated client-side) and `environment` label in the edge function payload so all variants share a group.
- Progress modal counts variants instead of outputs.

## Edge function (`generate-image/index.ts`)

- Accept optional `carouselGroupId` and `environment` fields.
- Persist them on the inserted `images` row (new nullable columns).
- No model change — uses the existing sensitive-content fallback chain.

## Database

One migration adding two nullable columns to `images`:
- `carousel_group_id uuid` (indexed)
- `environment text`

No RLS changes; existing `user_id` policies cover them.

## Gallery (out of scope for this plan)

Grouping/visual treatment in the gallery (e.g. a "set of 5" badge or carousel viewer in the lightbox) is **not** included here — this plan only ensures the data is generated and stored correctly so a follow-up can render groups. Confirm if you want the gallery treatment in the same pass.

## Files touched

- `supabase/migrations/<new>.sql` (new)
- `src/components/layout/GenerationPanel.tsx`
- `src/pages/Index.tsx`
- `src/hooks/useImages.ts` (type only — pick up new columns)
- `supabase/functions/generate-image/index.ts`

## Open questions

1. Default environment presets — OK with `Studio / Outdoor / Urban / Lifestyle / Minimal`, or do you have a preferred list (especially for swimwear/lingerie clients)?
2. Should the gallery visually group carousel sets now, or ship data-only first?
