ALTER TABLE public.generated_images
  ADD COLUMN IF NOT EXISTS carousel_group_id uuid,
  ADD COLUMN IF NOT EXISTS environment text;

CREATE INDEX IF NOT EXISTS idx_generated_images_carousel_group
  ON public.generated_images(carousel_group_id);