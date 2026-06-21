import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpgradeEmailRequest {
  email: string;
  firstName: string;
  plan: "starter" | "professional" | "enterprise";
}

const getEmailContent = (firstName: string, plan: string) => {
  const displayName = firstName || "there";
  
  const planContent = {
    starter: {
      subject: "Thank you for choosing Floowy.ai Starter! Let's make your ideas flow 💡",
      title: "Thank you for choosing the Starter Plan at Floowy.ai!",
      intro: "You've taken your first step toward faster, smarter, and more affordable content creation.",
      mainText: "Your account is now fully active, and you can start using your credits right away to create stunning visuals and videos for your projects.",
      tipsTitle: "Here are a few quick tips to get the most from your plan:",
      tips: [
        "Explore all our creative tools and templates",
        "Save and organize creatives directly in your account"
      ],
      closing: "If you ever have questions or need help, our team is just one message away. Reach us anytime at hello@floowy.ai - we're happy to support you.",
      signoff: "Enjoy creating with Floowy.ai!"
    },
    professional: {
      subject: "Welcome to Floowy.ai Professional – Let's elevate your creativity 🚀",
      title: "We're excited to welcome you to the Professional Plan!",
      intro: "You now have access to more credits, advanced features, and the flexibility to scale your content creation.",
      mainText: "Your Floowy.ai account is ready to help you:",
      tipsTitle: "What you can do now:",
      tips: [
        "Produce high-quality creatives and videos at scale",
        "Save valuable time with AI automation",
        "Maximize performance with our advanced workflow tools"
      ],
      closing: "If you ever need assistance or want to make the most of your plan, our support team is here for you at hello@floowy.ai.",
      signoff: "We're thrilled to see what you'll create next. Let's make your brand stand out!"
    },
    enterprise: {
      subject: "Welcome to Floowy.ai Enterprise – Let's build the future of content creation together ⚡",
      title: "Thank you for choosing the Enterprise Plan at Floowy.ai!",
      intro: "We're proud to have you with us and excited to support your creative growth at scale.",
      mainText: "As an Enterprise user, you have priority access to our platform and the opportunity to shape how Floowy.ai evolves. We value your feedback and are open to developing new features or workflows based on your needs.",
      tipsTitle: "A few ways to get started:",
      tips: [
        "Use your credits to create high-quality visuals and videos fast",
        "Share your feedback directly — your insights help us innovate and improve for you"
      ],
      closing: "If you ever need support or want to discuss potential feature development, just reach us at hello@floowy.ai.",
      signoff: "We're thrilled to have you on board. Let's create something extraordinary together."
    }
  };

  const content = planContent[plan as keyof typeof planContent];
  
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
                  ${content.closing}
                </p>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 24px 0 16px; font-weight: 600;">
                  ${content.signoff}
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, firstName, plan }: UpgradeEmailRequest = await req.json();

    console.log(`Sending ${plan} upgrade email to:`, email);

    if (!email || !plan) {
      throw new Error("Email and plan are required");
    }

    if (!["starter", "professional", "enterprise"].includes(plan)) {
      throw new Error("Invalid plan type");
    }

    const emailContent = getEmailContent(firstName, plan);

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
      throw new Error("Failed to send upgrade email");
    }

    const data = await emailResponse.json();
    console.log("Upgrade email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-upgrade-email function:", error);
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
