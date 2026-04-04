import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DOCUMENT_CALLBACK_SECRET = Deno.env.get("DOCUMENT_CALLBACK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CallbackPayload = {
  evaluation_id?: number;
  docId?: string;
  doc_id?: string;
  googleDocId?: string;
  google_doc_id?: string;
  error?: string | null;
  status?: "ready" | "failed" | null;
};

function extractDocId(payload: CallbackPayload): string | null {
  const value =
    payload.docId ??
    payload.doc_id ??
    payload.googleDocId ??
    payload.google_doc_id;

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  const providedSecret =
    req.headers.get("x-callback-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!providedSecret || providedSecret !== DOCUMENT_CALLBACK_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized callback" }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const payload = (await req.json()) as CallbackPayload;
    const evaluationId = payload.evaluation_id;

    if (!evaluationId || !Number.isInteger(evaluationId)) {
      return new Response(JSON.stringify({ ok: false, error: "evaluation_id is required" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const docId = extractDocId(payload);
    const isFailed = payload.status === "failed" || (!docId && Boolean(payload.error));

    const updateValues = isFailed
      ? {
          document_status: "failed",
          document_error: payload.error?.trim() || "Document generation failed.",
          google_doc_id: null,
        }
      : {
          document_status: "ready",
          document_error: null,
          google_doc_id: docId,
        };

    if (!isFailed && !docId) {
      return new Response(JSON.stringify({ ok: false, error: "docId is required for ready status" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const { error } = await adminSupabase
      .from("evaluations")
      .update(updateValues)
      .eq("id", evaluationId);

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        evaluationId,
        status: updateValues.document_status,
        docId: docId ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
