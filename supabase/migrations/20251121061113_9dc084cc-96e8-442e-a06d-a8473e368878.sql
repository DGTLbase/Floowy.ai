-- Allow authenticated users to upload to products bucket
CREATE POLICY "Allow authenticated uploads to products bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users to update files in products bucket
CREATE POLICY "Allow authenticated updates to products bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Allow public read access to products bucket
CREATE POLICY "Allow public read access to products bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');