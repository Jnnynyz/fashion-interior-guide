ALTER TABLE public.analyses
  ADD COLUMN after_image_url text,
  ADD COLUMN after_image_path text;

-- Allow users to update their own analyses (needed so the edge function-issued update via service role isn't required for client retries, and for general consistency)
CREATE POLICY "Users can update own analyses"
ON public.analyses
FOR UPDATE
USING (auth.uid() = user_id);