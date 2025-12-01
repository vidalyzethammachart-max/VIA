import { supabase } from "../lib/supabaseClient";

// ---------- Types ----------
export type Rubric = Record<string, Record<string, number | null>>;

export type EvaluationPayload = {
  order_number: string;
  subject_name: string;
  overall_suggestion: string;
  rubric: Rubric;
};

// ---------- n8n (Forward to Supabase Edge Function) ----------
export async function saveEvaluationToN8N(payload: EvaluationPayload) {
  const { data, error } = await supabase.functions.invoke(
    "forward-to-n8n",
    { body: payload }
  );

  if (error) {
    console.error("❌ Error forwarding to n8n:", error);
    throw error;
  }

  return data;
}

// ---------- Supabase DB ----------
export async function saveEvaluation(payload: EvaluationPayload) {
  const { data, error } = await supabase
    .from("evaluations")
    .insert({
      order_number: payload.order_number,
      subject_name: payload.subject_name,
      overall_suggestion: payload.overall_suggestion,
      rubric: payload.rubric,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase insert error:", error);
    throw error;
  }

  return data;
}
