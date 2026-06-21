-- Add request_id column to batch_items to store FAL job IDs
ALTER TABLE batch_items 
ADD COLUMN request_id text;