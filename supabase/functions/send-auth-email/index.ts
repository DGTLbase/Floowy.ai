// Supabase Auth "Send Email" hook — every auth email goes out through Resend.
//
// WHY THIS HANDLES EVERY TYPE
// A Send Email Hook that answers 200 tells GoTrue "handled, don't send it
// yourself". This function previously answered 200 for everything that was not
// `recovery` and then sent nothing, so signup confirmations, magic links,
// invites and email-change confirmations were accepted and silently discarded —
// users never received them. It also burned the auth email rate limit, because
// GoTrue counts the send BEFORE invoking the hook, which is what produced
// "email rate limit exceeded" during signup: quota spent on mail nobody got,
// then retries spending more.
//
// THIS HOOK ALWAYS ANSWERS 2xx.
// GoTrue turns any non-2xx from a Send Email Hook into a failed auth operation:
// returning 400/500 here surfaced to users as "Error creating account:
// Unexpected status code returned from hook: 500" and blocked signup entirely.
// A delivery failure — rotated Resend key, rate limit, unverified domain — must
// therefore be logged loudly and swallowed. A missing email is recoverable; a
// user who cannot create an account is not.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const HOOK_SECRET = Deno.env.get("AUTH_HOOK_SECRET") || "super-secret-webhook-secret";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEADER_IMG =
  "https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/email-header.png";

/** Shared shell so every auth email looks like the password-reset one. */
const shell = (heading: string, bodyHtml: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .content { padding: 40px 30px; background-color: #ffffff; }
            h1 { color: #000000; font-size: 28px; margin-bottom: 20px; }
            p { color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px; }
            .cta-button {
              display: inline-block;
              padding: 12px 30px;
              margin: 20px 0;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            }
            .warning-box {
              background-color: #fef3c7;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${HEADER_IMG}" alt="Floowy Header" style="width: 100%; display: block;" />
            <div class="content">
              <h1>${heading}</h1>
              ${bodyHtml}
              <p style="margin-top: 30px;">Stay creative,<br>The Floowy.ai Team</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Questions? Reach out to us at hello@floowy.ai
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

const ctaBlock = (url: string, label: string) => `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" class="cta-button" style="color: #ffffff !important;">${label}</a>
              </div>`;

/**
 * Verification URL for token-hash based flows.
 *
 * GoTrue's own /auth/v1/verify endpoint consumes the token and then bounces the
 * browser to redirect_to, so the app needs no special handling. Recovery is the
 * exception below: it already ships a working link shape that ResetPassword
 * parses, and that is deliberately left untouched.
 */
const verifyUrl = (tokenHash: string, type: string, redirectTo: string) =>
  `${SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}` +
  `&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirectTo)}`;

interface Built { subject: string; html: string }

function buildEmail(
  type: string,
  firstName: string,
  tokenHash: string,
  token: string,
  redirectTo: string,
): Built | null {
  switch (type) {
    // Unchanged from the version that has been working in production.
    case "recovery": {
      const resetLink = `${redirectTo}#access_token=${tokenHash}&type=recovery`;
      return {
        subject: "Reset your Floowy.ai password 🔒",
        html: shell(
          "Reset your Floowy.ai password 🔒",
          `<p>Hi ${firstName},</p>
              <p>No worries. It happens to the best of us!</p>
              <p>You recently requested to reset your password for your Floowy.ai account.</p>
              <p>Click the button below to set a new password:</p>
              ${ctaBlock(resetLink, "Reset My Password")}
              <p>If you didn't request this change, you can safely ignore this email. Your current password will remain the same.</p>
              <div class="warning-box">
                <p style="margin: 0; font-weight: bold; color: #92400e;">⏰ For security reasons, this link will expire in 60 minutes.</p>
              </div>
              <p>If you need any help, our team is always here at hello@floowy.ai.</p>`,
        ),
      };
    }

    case "signup":
    case "email_change":
    case "invite":
    case "magiclink": {
      const url = verifyUrl(tokenHash, type, redirectTo);
      const copy: Record<string, { subject: string; heading: string; body: string; cta: string }> = {
        signup: {
          subject: "Confirm your Floowy.ai account ✅",
          heading: "Confirm your email ✅",
          body: `<p>Hi ${firstName},</p>
              <p>Welcome to Floowy.ai! Confirm your email address to activate your account and start creating.</p>`,
          cta: "Confirm My Email",
        },
        magiclink: {
          subject: "Your Floowy.ai sign-in link 🔑",
          heading: "Sign in to Floowy.ai 🔑",
          body: `<p>Hi ${firstName},</p>
              <p>Click the button below to sign in. No password needed.</p>`,
          cta: "Sign Me In",
        },
        invite: {
          subject: "You've been invited to Floowy.ai 🎉",
          heading: "You're invited to Floowy.ai 🎉",
          body: `<p>Hi ${firstName},</p>
              <p>You've been invited to join Floowy.ai. Accept the invitation to set up your account.</p>`,
          cta: "Accept Invitation",
        },
        email_change: {
          subject: "Confirm your new Floowy.ai email address",
          heading: "Confirm your new email address",
          body: `<p>Hi ${firstName},</p>
              <p>Confirm this address to finish changing the email on your Floowy.ai account.</p>`,
          cta: "Confirm New Email",
        },
      };
      const c = copy[type];
      return {
        subject: c.subject,
        html: shell(
          c.heading,
          `${c.body}
              ${ctaBlock(url, c.cta)}
              <p>If the button doesn't work, paste this link into your browser:</p>
              <p style="word-break: break-all; color: #059669; font-size: 13px;">${url}</p>
              <p>Or enter this code: <strong style="font-size: 18px; letter-spacing: 2px;">${token}</strong></p>
              <div class="warning-box">
                <p style="margin: 0; font-weight: bold; color: #92400e;">⏰ This link expires in 60 minutes.</p>
              </div>
              <p>If you didn't request this, you can safely ignore this email.</p>`,
        ),
      };
    }

    // Code-only flow: no link, GoTrue just needs the 6-digit token delivered.
    case "reauthentication":
      return {
        subject: "Your Floowy.ai confirmation code",
        html: shell(
          "Your confirmation code",
          `<p>Hi ${firstName},</p>
              <p>Use this code to confirm it's you:</p>
              <p style="text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">${token}</p>
              <p>If you didn't request this, you can safely ignore this email.</p>`,
        ),
      };

    default:
      return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature
    const wh = new Webhook(HOOK_SECRET);
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
        user_metadata?: { full_name?: string };
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log("Auth email webhook triggered for:", user.email, "Type:", email_action_type);

    const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";
    const built = buildEmail(email_action_type, firstName, token_hash, token, redirect_to);

    // Unknown type: fail loudly so GoTrue sends it itself rather than the user
    // silently receiving nothing (the bug this function used to have).
    if (!built) {
      // Fail OPEN. A non-2xx here makes GoTrue abort the whole auth operation —
      // returning 400 for an unhandled type once broke account creation outright
      // ("Unexpected status code returned from hook: 500"). A missing email is
      // recoverable; a user who cannot sign up is not.
      console.error("UNHANDLED auth email type, no mail sent:", email_action_type);
      return new Response(JSON.stringify({ message: "Unhandled type, skipped" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Floowy.ai <hello@floowy.ai>",
        to: [user.email],
        subject: built.subject,
        html: built.html,
      }),
    });

    if (!emailResponse.ok) {
      // Log loudly, but still answer 200: GoTrue turns any non-2xx into a failed
      // signup / login / reset. Delivery problems (bad or rotated Resend key,
      // Resend rate limit, unverified domain) must never lock users out.
      const errorText = await emailResponse.text();
      console.error(
        `RESEND FAILED for ${email_action_type} — status ${emailResponse.status}:`,
        errorText.slice(0, 500),
      );
      return new Response(
        JSON.stringify({ message: "Email delivery failed, auth allowed to proceed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const data = await emailResponse.json();
    console.log(`${email_action_type} email sent successfully:`, data);

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    // Same reasoning as above: never hand GoTrue a non-2xx. Signature-verification
    // failures land here too, so a genuinely bogus caller is simply ignored rather
    // than being able to take auth down.
    console.error("ERROR in auth email webhook (auth allowed to proceed):", error?.message ?? error);
    return new Response(
      JSON.stringify({ message: "Hook error, auth allowed to proceed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
};

serve(handler);
