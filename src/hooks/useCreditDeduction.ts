import { supabase } from "@/integrations/supabase/client";

/**
 * Deducts credits from a user's balance and tracks total usage atomically.
 * Returns the new balance.
 */
export const deductCredits = async (
  userId: string,
  cost: number
): Promise<number> => {
  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: cost,
  });

  if (error) {
    console.error("Error deducting credits:", error);
    throw error;
  }

  return data as number;
};

/**
 * Checks if credits hit zero and sends out-of-credits email
 * Call this after deducting credits with the new balance
 */
export const checkAndSendOutOfCreditsEmail = async (
  newBalance: number,
  userEmail: string,
  userName: string
): Promise<void> => {
  if (newBalance <= 0 && userEmail) {
    try {
      const firstName = userName?.split(' ')[0] || 'there';
      
      await supabase.functions.invoke('send-out-of-credits-email', {
        body: {
          email: userEmail,
          firstName: firstName,
        },
      });
      console.log("Out-of-credits email triggered for user:", userEmail);
    } catch (emailError) {
      console.error("Failed to send out-of-credits email:", emailError);
    }
  }
};
