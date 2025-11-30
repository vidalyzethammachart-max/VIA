// src/services/evaluationService.ts
import { supabase } from "../lib/supabase";

export type EvaluationPayload = {
  subject_name: string;
  overall_suggestion: string;
  rubric: Record<string, Record<string, number | null>>;
  user_id?: string | null;
};

export async function saveEvaluation(payload: EvaluationPayload) {
  const { data, error } = await supabase
    .from("evaluations")
    .insert([payload])
    .select();

  if (error) {
    console.error("❌ Error saving evaluation:", error);
    throw error;
  }

  return data;
}
