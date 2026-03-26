
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Folders table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own folders" ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.folders FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generated images table
CREATE TABLE public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  quality TEXT NOT NULL DEFAULT '2K',
  format TEXT NOT NULL DEFAULT 'PNG',
  image_url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own images" ON public.generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images" ON public.generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON public.generated_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON public.generated_images FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_images_user_folder ON public.generated_images(user_id, folder_id);
CREATE INDEX idx_images_created ON public.generated_images(created_at DESC);

-- Saved prompts table
CREATE TABLE public.saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prompts" ON public.saved_prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prompts" ON public.saved_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON public.saved_prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON public.saved_prompts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_prompts_updated_at BEFORE UPDATE ON public.saved_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-images');

CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
