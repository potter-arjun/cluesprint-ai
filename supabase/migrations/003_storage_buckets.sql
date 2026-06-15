-- Create storage bucket for submission uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own team/mission folder
CREATE POLICY "Authenticated users can upload submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submissions');

-- Allow public read access to submission images
CREATE POLICY "Public read access for submissions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submissions');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete own submission files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
