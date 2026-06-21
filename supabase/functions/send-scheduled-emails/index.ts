import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BREVO_API_URL = 'https://api.brevo.com/v3';

async function brevoRequest(apiKey: string, path: string, method: string, body?: any) {
  const res = await fetch(`${BREVO_API_URL}${path}`, {
    method,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    console.error(`Brevo ${method} ${path} failed [${res.status}]:`, text);
    throw new Error(`Brevo API error [${res.status}]: ${text}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured (BREVO_API_KEY missing)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending emails that are due
    const now = new Date().toISOString();
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError);
      throw new Error(fetchError.message);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No scheduled emails to send', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingEmails.length} scheduled emails to send via Brevo`);
    let totalSuccess = 0;
    let totalFail = 0;

    for (const scheduledEmail of pendingEmails) {
      // Mark as sending
      await supabaseAdmin
        .from('scheduled_emails')
        .update({ status: 'sending' })
        .eq('id', scheduledEmail.id);

      const recipientEmails = scheduledEmail.recipient_emails as string[];

      try {
        // Step 1: Create list
        const listName = `Batch_${scheduledEmail.id.slice(0, 8)}_${Date.now()}`;
        const listData = await brevoRequest(BREVO_API_KEY, '/contacts/lists', 'POST', {
          name: listName,
          folderId: 1,
        });
        const listId = listData.id;

        // Step 2: Import contacts into the list
        const contacts = recipientEmails.map((email: string) => ({ email }));
        await brevoRequest(BREVO_API_KEY, '/contacts/import', 'POST', {
          jsonBody: contacts,
          listIds: [listId],
          updateExistingContacts: true,
        });

        // Step 4: Create campaign
        const campaignData = await brevoRequest(BREVO_API_KEY, '/emailCampaigns', 'POST', {
          name: `Batch_${scheduledEmail.id.slice(0, 8)}_${Date.now()}`,
          subject: scheduledEmail.subject,
          sender: { name: 'Floowy.ai', email: 'hello@floowy.ai' },
          type: 'classic',
          htmlContent: scheduledEmail.html_content,
          recipients: { listIds: [listId] },
        });

        // Step 5: Send now
        await brevoRequest(BREVO_API_KEY, `/emailCampaigns/${campaignData.id}/sendNow`, 'POST');

        // Update status to sent
        await supabaseAdmin
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', scheduledEmail.id);

        totalSuccess += recipientEmails.length;
        console.log(`Scheduled email ${scheduledEmail.id}: campaign sent to ${recipientEmails.length} recipients`);
      } catch (err) {
        console.error(`Failed to send scheduled email ${scheduledEmail.id}:`, err);

        await supabaseAdmin
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: (err as Error).message || 'Brevo campaign creation failed',
          })
          .eq('id', scheduledEmail.id);

        totalFail += recipientEmails.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: pendingEmails.length, totalSuccess, totalFail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-scheduled-emails:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
