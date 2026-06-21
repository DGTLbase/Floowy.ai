 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export const useKnowledgeBaseBonus = () => {
   const [hasClaimed, setHasClaimed] = useState<boolean | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [showPromptModal, setShowPromptModal] = useState(false);
   const { toast } = useToast();
 
   // Check if user has already claimed the bonus
   const checkBonusStatus = useCallback(async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         setIsLoading(false);
         return;
       }
 
       const { data: profile, error } = await supabase
         .from("profiles")
         .select("knowledge_base_bonus_claimed")
         .eq("id", user.id)
         .single();
 
       if (error) throw error;
 
       setHasClaimed(profile?.knowledge_base_bonus_claimed ?? false);
     } catch (error) {
       console.error("Error checking bonus status:", error);
       setHasClaimed(false);
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   useEffect(() => {
     checkBonusStatus();
   }, [checkBonusStatus]);
 
   // Claim the bonus credits
   const claimBonus = useCallback(async (): Promise<boolean> => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return false;
 
       // Double-check they haven't already claimed
       const { data: profile } = await supabase
         .from("profiles")
         .select("knowledge_base_bonus_claimed")
         .eq("id", user.id)
         .single();
 
       if (profile?.knowledge_base_bonus_claimed) {
         setHasClaimed(true);
         return false;
       }
 
       // Get current credits
       const { data: credits, error: creditsError } = await supabase
         .from("credits")
         .select("balance")
         .eq("user_id", user.id)
         .single();
 
       if (creditsError) throw creditsError;
 
       // Add 2 credits
       const newBalance = (credits?.balance || 0) + 2;
       const { error: updateCreditsError } = await supabase
         .from("credits")
         .update({ balance: newBalance })
         .eq("user_id", user.id);
 
       if (updateCreditsError) throw updateCreditsError;
 
       // Mark bonus as claimed
       const { error: updateProfileError } = await supabase
         .from("profiles")
         .update({ knowledge_base_bonus_claimed: true })
         .eq("id", user.id);
 
       if (updateProfileError) throw updateProfileError;
 
       setHasClaimed(true);
 
       toast({
         title: "🎉 You've earned 2 extra credits!",
         description: "Thanks for exploring the knowledge base. Use these credits to create amazing content!",
       });
 
       return true;
     } catch (error) {
       console.error("Error claiming bonus:", error);
       toast({
         title: "Error",
         description: "Failed to claim bonus credits. Please try again.",
         variant: "destructive",
       });
       return false;
     }
   }, [toast]);
 
   // Show the prompt modal (called from tools/dashboard)
   const triggerPrompt = useCallback(() => {
     if (hasClaimed === false) {
       setShowPromptModal(true);
     }
   }, [hasClaimed]);
 
   return {
     hasClaimed,
     isLoading,
     showPromptModal,
     setShowPromptModal,
     claimBonus,
     triggerPrompt,
     checkBonusStatus,
   };
 };