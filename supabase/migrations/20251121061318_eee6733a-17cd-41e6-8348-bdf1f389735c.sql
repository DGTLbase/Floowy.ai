-- Temporary policy: allow public insert for this specific file in products bucket
CREATE POLICY "Temp public upload for email-header.png"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] IS NULL -- root folder
  AND name = 'email-header.png'
);