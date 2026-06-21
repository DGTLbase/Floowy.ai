import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SIGNUP-REMINDERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Only target users who signed up on/after the date this reminder flow launched.
    // Existing users from before this cutoff must NOT receive the new reminder.
    const NEW_SIGNUP_CUTOFF_AT = "2026-05-19T00:00:00Z";

    // Calculate the date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStart = new Date(threeDaysAgo);
    threeDaysAgoStart.setHours(0, 0, 0, 0);
    const threeDaysAgoEnd = new Date(threeDaysAgo);
    threeDaysAgoEnd.setHours(23, 59, 59, 999);

    logStep("Checking for users who signed up 3 days ago", { 
      start: threeDaysAgoStart.toISOString(), 
      end: threeDaysAgoEnd.toISOString() 
    });

    // Get users who signed up exactly 3 days ago and are still on free plan
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan, created_at')
      .eq('plan', 'free')
      .gte('created_at', threeDaysAgoStart.toISOString())
      .lte('created_at', threeDaysAgoEnd.toISOString())
      .gte('created_at', NEW_SIGNUP_CUTOFF_AT);

    if (usersError) {
      logStep("Error fetching users", { error: usersError.message });
      throw usersError;
    }

    logStep("Found users to remind", { count: users?.length || 0 });

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No users to remind",
        count: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send reminder emails to each user
    const results = [];
    for (const user of users) {
      if (!user.email) {
        logStep("Skipping user without email", { userId: user.id });
        continue;
      }

      try {
        const firstName = user.full_name?.split(' ')[0] || 'there';
        
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-signup-reminder-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              email: user.email,
              firstName: firstName,
            }),
          }
        );

        if (response.ok) {
          logStep("Reminder email sent", { userId: user.id, email: user.email });
          results.push({ userId: user.id, status: 'sent' });
        } else {
          const errorData = await response.json();
          logStep("Failed to send reminder email", { userId: user.id, error: errorData });
          results.push({ userId: user.id, status: 'failed', error: errorData });
        }
      } catch (emailError: any) {
        logStep("Error sending email", { userId: user.id, error: emailError.message });
        results.push({ userId: user.id, status: 'error', error: emailError.message });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    logStep("Completed", { total: users.length, sent: sentCount });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sent ${sentCount} reminder emails`,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
