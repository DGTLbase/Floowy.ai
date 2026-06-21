import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (error || !data) {
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
    
    setIsLoading(false);
  };

  return { isAdmin, isLoading };
};
