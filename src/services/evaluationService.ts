// src/services/evaluationService.ts
import { supabase } from "../lib/supabaseClient";

// รูปแบบ rubric ที่ส่งมาจากฟอร์ม
export type RubricPayload = {
  [sectionId: string]: {
    [questionId: string]: number | null;
  };
};

export interface EvaluationPayload {
  order_number?: string | null;
  subject_name: string;
  overall_suggestion?: string | null;
  rubric: RubricPayload;
}

export type RubricValue = number | null;

export type Rubric = {
  [sectionId: string]: {
    [questionId: string]: RubricValue;
  };
};


/**
 * บันทึกผลประเมินลงตาราง evaluations
 */
export async function submitEvaluation(payload: EvaluationPayload) {
  try {
    const { data, error } = await supabase
      .from("evaluations")
      .insert([
        {
          order_number: payload.order_number ?? null,
          subject_name: payload.subject_name,
          overall_suggestion: payload.overall_suggestion ?? null,
          rubric: payload.rubric, // jsonb
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    // ส่งต่อไป n8n
    const n8nUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.warn("N8N webhook URL is not defined.");
      return data;
    }
    await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return data;
  } catch (err) {
    console.error("Error saving evaluation:", err);
    throw err;
  }
}
