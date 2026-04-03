import { supabase } from "../lib/supabaseClient";
import { accountingService } from "./accountingService";

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
  google_doc_id?: string | null;
}

type ForwardPayload = EvaluationPayload & {
  evaluation_id?: number;
};

export type RubricValue = number | null;

export type Rubric = {
  [sectionId: string]: {
    [questionId: string]: RubricValue;
  };
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = Reflect.get(error, "message");
    if (typeof maybeMessage === "string" && maybeMessage) {
      return maybeMessage;
    }
  }

  return String(error);
}

export async function submitEvaluation(payload: EvaluationPayload) {
  try {
    const { data, error } = await supabase
      .from("evaluations")
      .insert([
        {
          user_id: payload.user_id ?? null,
          order_number: payload.order_number ?? null,
          subject_name: payload.subject_name,
          overall_suggestion: payload.overall_suggestion ?? null,
          rubric: payload.rubric,
          google_doc_id: payload.google_doc_id ?? null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    if (payload.user_id) {
      void accountingService
        .logActivity({
          user_id: payload.user_id,
          action: "evaluation.submitted",
          resource: "evaluations",
          metadata: {
            evaluation_id: data?.id,
            order_number: payload.order_number ?? null,
          },
        })
        .catch((logError) => {
          console.error("Activity log failed:", logError);
        });
    }

    const forwardPayload: ForwardPayload = {
      ...payload,
      evaluation_id: data?.id,
    };

    const { error: forwardError } = await supabase.functions.invoke("forward-to-n8n", {
      body: forwardPayload,
    });

    if (forwardError) {
      console.error("Edge function forwarding failed:", forwardError);
      throw new Error(`forward-to-n8n failed: ${getErrorMessage(forwardError)}`);
    }

    return data;
  } catch (err) {
    console.error("Error saving evaluation:", err);
    throw err;
  }
}
