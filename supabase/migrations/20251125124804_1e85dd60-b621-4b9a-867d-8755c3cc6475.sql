-- Fix pg_net installation so that schema "net" exists and net.http_post can be called
DROP EXTENSION IF EXISTS pg_net;

-- Create pg_net with its default schema ("net")
CREATE EXTENSION pg_net;

-- Ensure the service role can use the net schema and its functions
GRANT USAGE ON SCHEMA net TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO service_role;