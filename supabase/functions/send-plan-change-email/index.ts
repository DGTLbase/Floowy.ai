import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlanChangeEmailRequest {
  email: string;
  firstName: string;
  oldPlan: "free" | "starter" | "professional" | "enterprise";
  newPlan: "free" | "starter" | "professional" | "enterprise";
}

const PLAN_NAMES = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const getEmailContent = (firstName: string, oldPlan: string, newPlan: string) => {
  const displayName = firstName || "there";
  const oldPlanName = PLAN_NAMES[oldPlan as keyof typeof PLAN_NAMES];
  const newPlanName = PLAN_NAMES[newPlan as keyof typeof PLAN_NAMES];
  
  // Determine if it's an upgrade or downgrade
  const planOrder = ["free", "starter", "professional", "enterprise"];
  const isUpgrade = planOrder.indexOf(newPlan) > planOrder.indexOf(oldPlan);
  
  if (isUpgrade) {
    // Upgrade email content
    const upgradeContent = {
      starter: {
        subject: `You've upgraded to ${newPlanName}! 🎉`,
        title: `Your plan has been upgraded to ${newPlanName}!`,
        intro: `Great news! You've successfully upgraded from ${oldPlanName} to ${newPlanName}.`,
        mainText: "Your new plan is now active, giving you access to more credits and features to supercharge your content creation.",
        tipsTitle: "What's new with your upgrade:",
        tips: [
          "More monthly credits to create stunning visuals and videos",
          "Access to advanced creative tools and templates",
          "Priority support from our team"
        ],
      },
      professional: {
        subject: `Welcome to ${newPlanName}! 🚀`,
        title: `You've upgraded to ${newPlanName}!`,
        intro: `Excellent choice! You've successfully upgraded from ${oldPlanName} to ${newPlanName}.`,
        mainText: "Your account now has access to our Professional tier, with significantly more credits and advanced features to scale your content creation.",
        tipsTitle: "New capabilities unlocked:",
        tips: [
          "Significantly increased monthly credits for high-volume production",
          "Advanced AI tools and workflow automation",
          "Priority support with faster response times"
        ],
      },
      enterprise: {
        subject: `Welcome to ${newPlanName}! ⚡`,
        title: `You've upgraded to ${newPlanName}!`,
        intro: `Thank you for choosing our highest tier! You've successfully upgraded from ${oldPlanName} to ${newPlanName}.`,
        mainText: "As an Enterprise user, you now have unlimited access to our platform with the highest credit allocation and direct influence on feature development.",
        tipsTitle: "Enterprise benefits:",
        tips: [
          "Maximum monthly credits for enterprise-scale production",
          "Early access to new features and beta tools",
          "Direct line to our product team for feature requests",
          "Dedicated account support",
          "Custom workflow development available"
        ],
      },
    };

    const content = upgradeContent[newPlan as keyof typeof upgradeContent];
    
    return {
      subject: content.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${content.subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <tr>
                <td align="center" style="padding-bottom: 0;">
                  <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy.ai - High Quality Marketing Content With AI Power" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
                </td>
              </tr>
              <tr>
                <td>
                  <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
                    ${content.title}
                  </h1>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                    Hi ${displayName},
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                    ${content.intro}
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    ${content.mainText}
                  </p>
                  
                  <h2 style="color: #000000; font-size: 20px; font-weight: 700; margin: 32px 0 20px;">
                    ${content.tipsTitle}
                  </h2>
                  
                  <ul style="margin: 0; padding: 0 0 0 20px; list-style-type: disc;">
                    ${content.tips.map(tip => `
                      <li style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 8px;\">${tip}</li>
                    `).join('')}
                  </ul>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 16px;">
                    If you have any questions or need assistance with your new plan, we're here to help at hello@floowy.ai.
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 24px 0 16px; font-weight: 600;">
                    Enjoy your enhanced creative power with Floowy.ai!
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 24px;">
                    Best regards,<br>
                    The Floowy.ai Team<br>
                    <a href="mailto:hello@floowy.ai" style="color: #22c55e; text-decoration: underline; font-weight: 600;">hello@floowy.ai</a>
                  </p>
                  
                  <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 40px;">
                    <p style="color: #666666; font-size: 14px; text-align: center; margin: 0;">
                      <a href="https://floowy.ai" style="color: #666666; text-decoration: underline;">Visit our website</a>
                      •
                      <a href="https://floowy.ai/pricing" style="color: #666666; text-decoration: underline;">View plans</a>
                      •
                      <a href="https://floowy.ai/contact" style="color: #666666; text-decoration: underline;">Contact us</a>
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    };
  } else {
    // Downgrade email content
    return {
      subject: `Your plan has been changed to ${newPlanName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Plan Change Confirmation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <tr>
                <td align="center" style="padding-bottom: 0;">
                  <img src="https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png" alt="Floowy.ai - High Quality Marketing Content With AI Power" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;">
                </td>
              </tr>
              <tr>
                <td>
                  <h1 style="color: #000000; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">
                    Your plan has been changed to ${newPlanName}
                  </h1>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                    Hi ${displayName},
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                    We've successfully updated your subscription from ${oldPlanName} to ${newPlanName}.
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    Your new plan is now active. ${newPlan === "free" ? "You'll continue to have access to our core features with the free plan's credit allocation." : `You'll now receive the ${newPlanName} plan's monthly credits and features.`}
                  </p>
                  
                  <h2 style="color: #000000; font-size: 20px; font-weight: 700; margin: 32px 0 20px;">
                    What this means for you:
                  </h2>
                  
                  <ul style="margin: 0; padding: 0 0 0 20px; list-style-type: disc;">
                    <li style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 8px;\">Your current credits remain unchanged</li>
                    <li style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 8px;\">Your next billing cycle will reflect the new plan pricing</li>
                    <li style=\"color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 8px;\">You can upgrade anytime from your account settings</li>
                  </ul>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 16px;">
                    If you changed your plan by mistake or have any questions, please don't hesitate to reach out to us at hello@floowy.ai. We're happy to help!
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 24px 0 16px; font-weight: 600;">
                    Thank you for using Floowy.ai!
                  </p>
                  
                  <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 32px 0 24px;">
                    Best regards,<br>
                    The Floowy.ai Team<br>
                    <a href="mailto:hello@floowy.ai" style="color: #22c55e; text-decoration: underline; font-weight: 600;">hello@floowy.ai</a>
                  </p>
                  
                  <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 40px;">
                    <p style="color: #666666; font-size: 14px; text-align: center; margin: 0;">
                      <a href="https://floowy.ai" style="color: #666666; text-decoration: underline;">Visit our website</a>
                      •
                      <a href="https://floowy.ai/pricing" style="color: #666666; text-decoration: underline;">View plans</a>
                      •
                      <a href="https://floowy.ai/contact" style="color: #666666; text-decoration: underline;">Contact us</a>
                    </p>
                  </div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, firstName, oldPlan, newPlan }: PlanChangeEmailRequest = await req.json();

    console.log(`Sending plan change email to:`, email, `(${oldPlan} → ${newPlan})`);

    if (!email || !oldPlan || !newPlan) {
      throw new Error("Email, oldPlan, and newPlan are required");
    }

    if (!["free", "starter", "professional", "enterprise"].includes(oldPlan) ||
        !["free", "starter", "professional", "enterprise"].includes(newPlan)) {
      throw new Error("Invalid plan type");
    }

    const emailContent = getEmailContent(firstName, oldPlan, newPlan);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send plan change email");
    }

    const data = await emailResponse.json();
    console.log("Plan change email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-plan-change-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);