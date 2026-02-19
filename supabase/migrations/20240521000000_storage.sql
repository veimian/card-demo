-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'attachments' );

-- Policy to allow authenticated uploads
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'attachments' AND auth.role() = 'authenticated' );

-- Policy to allow users to update/delete their own files (optional, but good practice)
CREATE POLICY "User Update Own Objects"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'attachments' AND auth.uid() = owner );

CREATE POLICY "User Delete Own Objects"
ON storage.objects FOR DELETE
USING ( bucket_id = 'attachments' AND auth.uid() = owner );
