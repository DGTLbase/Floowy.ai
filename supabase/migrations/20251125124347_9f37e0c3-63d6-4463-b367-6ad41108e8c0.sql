-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Grant usage on net schema to authenticated users
GRANT USAGE ON SCHEMA net TO authenticated, service_role;