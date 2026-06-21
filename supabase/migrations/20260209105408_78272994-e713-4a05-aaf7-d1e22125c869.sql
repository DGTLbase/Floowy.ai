-- Allow uploads to admin-uploads folder for anyone (admin mode uses this path)
CREATE POLICY "Allow admin-uploads folder access"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'admin-uploads'
);

-- Allow reading from admin-uploads folder
CREATE POLICY "Allow reading admin-uploads folder"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'admin-uploads'
);

-- Allow updating in admin-uploads folder
CREATE POLICY "Allow updating admin-uploads folder"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'admin-uploads'
);

-- Allow deleting from admin-uploads folder
CREATE POLICY "Allow deleting admin-uploads folder"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'admin-uploads'
);