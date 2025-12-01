// @ts-ignore: Deno std types (รันบน Supabase ไม่ใช่ Node)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL")!;

// CORS headers สำหรับเรียกจากเว็บ (localhost / prod)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // จัดการ preflight (OPTIONS) ก่อน
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message ?? String(err) }),
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
