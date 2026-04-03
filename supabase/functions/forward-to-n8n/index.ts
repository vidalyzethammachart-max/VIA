import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[forward-to-n8n] request received", {
    method: req.method,
    hasWebhookUrl: Boolean(WEBHOOK_URL),
  });

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!jwt) {
      console.error("[forward-to-n8n] missing bearer token");
      return new Response(
        JSON.stringify({ ok: false, error: "Missing bearer token" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.error("[forward-to-n8n] auth failed", {
        authError: authError?.message ?? null,
      });
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log("[forward-to-n8n] user authenticated", { userId: user.id });

    const payload = await req.json();
    const securedPayload = {
      ...payload,
      actor_user_id: user.id,
    };

    console.log("[forward-to-n8n] forwarding payload", {
      subjectName: payload?.subject_name ?? null,
      orderNumber: payload?.order_number ?? null,
      hasEmail: Boolean(payload?.Email),
    });

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(securedPayload),
    });

    console.log("[forward-to-n8n] n8n response received", {
      status: res.status,
      ok: res.ok,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[forward-to-n8n] n8n returned non-2xx", {
        status: res.status,
        body: text,
      });
      return new Response(
        JSON.stringify({ ok: false, error: text }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const successText = await res.text();
    console.log("[forward-to-n8n] success", {
      status: res.status,
      bodyPreview: successText.slice(0, 300),
    });

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[forward-to-n8n] unhandled error", {
      message,
      stack: err instanceof Error ? err.stack ?? null : null,
    });

    return new Response(
      JSON.stringify({ ok: false, error: message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
