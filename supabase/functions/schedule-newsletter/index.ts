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
    const adminToken = req.headers.get('admin-token');
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Missing admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Verify admin session
    const { data: session } = await supabaseAdmin
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('token', adminToken)
      .maybeSingle();

    if (!session || new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subject, htmlContent, recipientEmails, scheduledAt } = await req.json();

    if (!subject || !htmlContent || !recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0 || !scheduledAt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subject, htmlContent, recipientEmails, scheduledAt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scheduling Brevo campaign for ${scheduledAt} to ${recipientEmails.length} recipients`);

    // Step 1: Create a temporary list for this campaign
    const listName = `Scheduled_${Date.now()}`;
    const listData = await brevoRequest(BREVO_API_KEY, '/contacts/lists', 'POST', {
      name: listName,
      folderId: 1,
    });
    const listId = listData.id;
    console.log(`Created Brevo list: ${listId}`);

    // Step 2: Import contacts into the list
    const contacts = recipientEmails.map((email: string) => ({ email }));
    await brevoRequest(BREVO_API_KEY, '/contacts/import', 'POST', {
      jsonBody: contacts,
      listIds: [listId],
      updateExistingContacts: true,
    });
    console.log('Contacts imported to Brevo list');

    // Step 4: Format scheduledAt for Brevo (YYYY-MM-DDTHH:mm:ss.000Z → "YYYY-MM-DD HH:mm:ss")
    const brevoScheduledAt = scheduledAt.replace('T', ' ').replace(/\.\d{3}Z$/, '');

    // Step 5: Create the campaign with scheduledAt — Brevo handles the scheduling natively
    const campaignData = await brevoRequest(BREVO_API_KEY, '/emailCampaigns', 'POST', {
      name: `Scheduled_${Date.now()}`,
      subject,
      sender: { name: 'Floowy.ai', email: 'hello@floowy.ai' },
      type: 'classic',
      htmlContent,
      recipients: { listIds: [listId] },
      scheduledAt: brevoScheduledAt,
    });
    const campaignId = campaignData.id;
    console.log(`Created scheduled Brevo campaign: ${campaignId}`);

    // Record in scheduled_emails for admin UI tracking
    const { data, error } = await supabaseAdmin
      .from('scheduled_emails')
      .insert({
        subject,
        html_content: htmlContent,
        recipient_emails: recipientEmails,
        scheduled_at: scheduledAt,
        status: 'pending',
        created_by: session.admin_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    console.log(`Newsletter scheduled via Brevo for ${scheduledAt}`);

    return new Response(
      JSON.stringify({ success: true, scheduledEmail: data, campaignId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in schedule-newsletter:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
