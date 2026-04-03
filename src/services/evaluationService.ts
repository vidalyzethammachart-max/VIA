// src/services/evaluationService.ts
import { supabase } from "../lib/supabaseClient";
import { accountingService } from "./accountingService";

// รูปแบบ rubric ที่ส่งมาจากฟอร์ม
export type RubricPayload = {
  [sectionId: string]: {
    [questionId: string]: number | null;
  };
};

export interface EvaluationPayload {
  user_id?: string;
  order_number?: string | null;
  subject_name: string;
  overall_suggestion?: string | null;
  rubric: RubricPayload;
  Email?: string | null;
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

    if (payload.user_id) {
      void accountingService.logActivity({
        user_id: payload.user_id,
        action: "evaluation.submitted",
        resource: "evaluations",
        metadata: {
          evaluation_id: data?.id,
          order_number: payload.order_number ?? null,
        },
      }).catch((logError) => {
        console.error("Activity log failed:", logError);
      });
    }

    // ส่งต่อไป n8n ผ่าน Supabase Edge Function (ไม่เปิดเผย webhook ใน frontend)
    const { error: forwardError } = await supabase.functions.invoke("forward-to-n8n", {
      body: payload,
    });
    if (forwardError) {
      console.error("Edge function forwarding failed:", forwardError);
    }

    return data;
  } catch (err) {
    console.error("Error saving evaluation:", err);
    throw err;
  }
}
