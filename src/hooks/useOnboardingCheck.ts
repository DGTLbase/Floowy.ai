import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useOnboardingCheck = (skip = false) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(!skip);

  useEffect(() => {
    if (skip) return;
    
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // If there's an active admin session, don't force redirect to auth
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
          setIsChecking(false);
          return;
        }

        navigate("/auth");
        setIsChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile?.onboarding_completed) {
        navigate("/onboarding");
      }
      
      setIsChecking(false);
    };

    checkOnboarding();
  }, [navigate, skip]);

  return { isChecking };
};