import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schemas
const loginSchema = z.object({
  action: z.literal('login'),
  email: z.string().email().max(255).transform(val => val.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

const tokenSchema = z.object({
  action: z.enum(['verify', 'logout']),
  token: z.string().uuid(),
});

// Simple in-memory rate limiter (resets on function cold start)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    return false;
  }
  
  // Reset if window has passed
  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
}

function recordLoginAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts || now - attempts.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    attempts.count++;
  }
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action } = body;

    // Login action
    if (action === 'login') {
      // Check rate limiting
      if (isRateLimited(clientIP)) {
        console.log(`Rate limited login attempt from IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ error: 'Too many login attempts. Please try again in 15 minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate input
      const parseResult = loginSchema.safeParse(body);
      if (!parseResult.success) {
        console.log('Login validation failed:', parseResult.error.errors);
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { email, password } = parseResult.data;

      // Record login attempt before checking credentials
      recordLoginAttempt(clientIP);

      // Find admin by email
      const { data: admin, error: adminError } = await supabaseClient
        .from('admin_accounts')
        .select('*')
        .eq('email', email)
        .single();

      if (adminError || !admin) {
        console.log(`Failed login attempt for email: ${email} from IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password using bcrypt (with legacy SHA-256 fallback)
      let isValid = false;
      
      // Prefer bcrypt if available
      if (admin.password_hash_bcrypt) {
        isValid = bcrypt.compareSync(password, admin.password_hash_bcrypt);
      } else if (admin.password_hash) {
        // Legacy SHA-256 fallback for old accounts
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        isValid = passwordHash === admin.password_hash;
        
        // Migrate to bcrypt on successful login
        if (isValid) {
          const bcryptHash = bcrypt.hashSync(password, 10);
          await supabaseClient
            .from('admin_accounts')
            .update({ password_hash_bcrypt: bcryptHash })
            .eq('id', admin.id);
        }
      }

      if (!isValid) {
        console.log(`Failed login attempt for admin: ${admin.email} from IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Clear rate limit on successful login
      clearLoginAttempts(clientIP);

      // Create session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

      const { error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .insert({
          admin_id: admin.id,
          token: sessionToken,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        throw sessionError;
      }

      // Update last login
      await supabaseClient
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

      console.log(`Successful login for admin: ${admin.email} from IP: ${clientIP}`);

      return new Response(
        JSON.stringify({
          token: sessionToken,
          admin: {
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify session action
    if (action === 'verify') {
      const parseResult = tokenSchema.safeParse(body);
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({ error: 'Token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { token } = parseResult.data;

      const { data: session, error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .select('*, admin_accounts(*)')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          admin: {
            id: session.admin_accounts.id,
            email: session.admin_accounts.email,
            full_name: session.admin_accounts.full_name,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Logout action
    if (action === 'logout') {
      const parseResult = tokenSchema.safeParse(body);
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({ error: 'Token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { token } = parseResult.data;

      await supabaseClient
        .from('admin_sessions')
        .delete()
        .eq('token', token);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin account action - REMOVED for security
    // Use SQL console or Supabase CLI to create admin accounts
    if (action === 'create') {
      return new Response(
        JSON.stringify({ error: 'Admin creation via API is disabled for security. Use SQL console to create admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in admin-auth:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
