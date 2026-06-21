
-- Create a function to atomically deduct credits and track usage
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE public.credits
  SET balance = balance - p_amount,
      total_credits_used = total_credits_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO new_balance;
  
  RETURN new_balance;
END;
$$;
