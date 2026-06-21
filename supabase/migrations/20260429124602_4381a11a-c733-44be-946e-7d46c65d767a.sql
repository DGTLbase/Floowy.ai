CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_balance integer;
BEGIN
  UPDATE public.credits
  SET balance = balance - p_amount,
      total_credits_used = total_credits_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO new_balance;

  INSERT INTO public.credit_history (user_id, amount, balance_after, action_type, description)
  VALUES (p_user_id, -p_amount, new_balance, 'usage', 'Credits spent on generation');

  RETURN new_balance;
END;
$function$;