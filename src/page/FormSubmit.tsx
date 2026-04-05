import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import MainNavbar from "../components/MainNavbar";
import { SectionCard } from "../components/SectionCard";
import { LIKERT_LABELS, SECTIONS, type LikertValue } from "../config/sections";
import { normalizeRole, type AppRole } from "../lib/roles";
import { supabase } from "../lib/supabaseClient";
import { roleRequestService } from "../services/roleRequestService";
import {
  submitEvaluation,
  type EvaluationPayload,
  type Rubric,
} from "../services/evaluationService";

function FormSubmit() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [answers, setAnswers] = useState<
    Record<string, Record<string, LikertValue | undefined>>
  >({});
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<AppRole>("user");
  const [isRequestingRole, setIsRequestingRole] = useState(false);
  const [roleRequestMessage, setRoleRequestMessage] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        return;
      }

      setUserEmail(user.email ?? null);
      setAuthUserId(user.id);

      void supabase
        .from("user_information")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setUserRole(normalizeRole(data?.role));
        });
    });
  }, []);

  const handleToggleAnswer = (
    sectionId: string,
    questionLabel: string,
    value: LikertValue,
  ) => {
    setAnswers((prev) => {
      const sectionAnswers = prev[sectionId] || {};
      const current = sectionAnswers[questionLabel];
      const nextValue = current === value ? undefined : value;

      return {
        ...prev,
        [sectionId]: {
          ...sectionAnswers,
          [questionLabel]: nextValue,
        },
      };
    });
  };

  const buildRubric = (): Rubric => {
    const rubric: Rubric = {};

    SECTIONS.forEach((section) => {
      const sectionAnswers = answers[section.id] ?? {};
      rubric[section.id] = {};

      section.questions.forEach((question) => {
        const value = sectionAnswers[question.label];
        rubric[section.id][question.label] = typeof value === "number" ? value : null;
      });
    });

    return rubric;
  };

  const validateForm = (): string | null => {
    if (!authUserId) {
      return "Your session is not ready. Please sign in again and retry.";
    }

    if (!orderNumber.trim()) {
      return "Please fill in the order number.";
    }

    if (!subjectName.trim()) {
      return "Please fill in the subject name.";
    }

    for (const section of SECTIONS) {
      const sectionAnswers = answers[section.id] ?? {};

      for (const question of section.questions) {
        const value = sectionAnswers[question.label];
        if (typeof value !== "number") {
          return `Please answer every rubric question before submitting. Missing item: ${section.title}`;
        }
      }
    }

    if (!comment.trim()) {
      return "Please fill in the overall suggestion.";
    }

    return null;
  };

  const buildPayload = (): EvaluationPayload | null => {
    if (!authUserId) {
      return null;
    }

    return {
      user_id: authUserId,
      order_number: orderNumber.trim(),
      subject_name: subjectName.trim(),
      overall_suggestion: comment.trim(),
      rubric: buildRubric(),
      Email: userEmail || undefined,
    };
  };

  const resetForm = () => {
    setOrderNumber("");
    setSubjectName("");
    setAnswers({});
    setComment("");
    setShowValidation(false);
  };

  const isOrderNumberInvalid = showValidation && !orderNumber.trim();
  const isSubjectNameInvalid = showValidation && !subjectName.trim();
  const isCommentInvalid = showValidation && !comment.trim();

  useEffect(() => {
    if (!showValidation) {
      return;
    }

    setSubmitErrorMessage(validateForm());
  }, [authUserId, orderNumber, subjectName, answers, comment, showValidation]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setShowValidation(true);
      setSubmitErrorMessage(validationError);
      return;
    }

    setIsSaving(true);

    const payload = buildPayload();
    if (!payload) {
      setSubmitErrorMessage("Your session is not ready. Please sign in again and retry.");
      setIsSaving(false);
      return;
    }

    try {
      const result = await submitEvaluation(payload);
      resetForm();
      navigate("/my-forms", {
        replace: true,
        state: { generated: true, evaluationId: result.id },
      });
    } catch (error) {
      console.error("Error while saving:", error);
      setSubmitErrorMessage(
        error instanceof Error ? error.message : "Failed to submit the evaluation.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestEditorRole = async () => {
    if (!authUserId) {
      return;
    }

    setIsRequestingRole(true);
    setRoleRequestMessage(null);

    try {
      await roleRequestService.requestRole("editor");
      setRoleRequestMessage("Role request submitted. Please wait for admin review.");
    } catch (requestError: unknown) {
      setRoleRequestMessage(
        requestError instanceof Error ? requestError.message : "Failed to request role.",
      );
    } finally {
      setIsRequestingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar />

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        {userRole === "user" && (
          <section className="ui-hover-card mb-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Need editor access?</h2>
            <p className="mt-1 text-xs text-slate-500">
              Submit a role request and wait for admin approval before using the form.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRequestEditorRole}
                disabled={isRequestingRole}
                className="btn-primary disabled:bg-slate-400"
              >
                {isRequestingRole ? "Submitting..." : "Request Editor Role"}
              </button>
              <Link
                to="/role-requests"
                className="btn-secondary text-center font-medium"
              >
                View Requests
              </Link>
            </div>
            {roleRequestMessage && (
              <p className="mt-3 text-xs text-slate-600">{roleRequestMessage}</p>
            )}
          </section>
        )}

        {userRole !== "user" && (
          <section className="ui-hover-card mb-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Submission workspace</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Completed documents are stored on each evaluation and can be reopened from your
                  forms dashboard.
                </p>
              </div>
              <Link
                to="/my-forms"
                className="btn-primary text-center"
              >
                Go to My Forms
              </Link>
            </div>
          </section>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          <section className="ui-hover-card space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="space-y-1 md:w-40">
                <label className="text-xs font-medium text-slate-700">Order number</label>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. 1"
                  required
                  aria-invalid={isOrderNumberInvalid}
                  className={`w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                    isOrderNumberInvalid
                      ? "border border-red-400 focus:border-red-400 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-950/40"
                      : "border border-slate-200 focus:border-primary focus:ring-primary/60 dark:border-slate-700"
                  }`}
                />
                {isOrderNumberInvalid && (
                  <p className="text-xs font-medium text-red-600">Please fill out this field.</p>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-slate-700">Subject name</label>
                <input
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Video Test"
                  required
                  aria-invalid={isSubjectNameInvalid}
                  className={`w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                    isSubjectNameInvalid
                      ? "border border-red-400 focus:border-red-400 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-950/40"
                      : "border border-slate-200 focus:border-primary focus:ring-primary/60 dark:border-slate-700"
                  }`}
                />
                {isSubjectNameInvalid && (
                  <p className="text-xs font-medium text-red-600">Please fill out this field.</p>
                )}
              </div>
            </div>
          </section>

          <section className="ui-hover-card space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900 md:text-base">
                Evaluation rubric
              </h2>
              <p className="text-xs text-slate-600 md:text-sm">
                Score each question on a 1-5 scale. The generated document will use these values
                immediately after submission.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-600 md:text-sm">
              {([1, 2, 3, 4, 5] as LikertValue[]).map((v) => (
                <div
                  key={v}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                    {v}
                  </span>
                  <span>{LIKERT_LABELS[v]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            {SECTIONS.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                answers={answers[section.id] || {}}
                showValidation={showValidation}
                onToggle={(questionLabel, value) =>
                  handleToggleAnswer(section.id, questionLabel, value)
                }
              />
            ))}
          </section>

          <section className="ui-hover-card space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <label className="text-sm font-semibold text-slate-800">Overall suggestion</label>
            <p className="text-xs text-slate-500">
              Provide summary notes, highlights, risks, and any recommended improvements.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
              aria-invalid={isCommentInvalid}
              className={`mt-1 w-full resize-none rounded-xl bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
                isCommentInvalid
                  ? "border border-red-400 focus:border-red-400 focus:ring-red-200 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-950/40"
                  : "border border-slate-200 focus:border-primary focus:ring-primary/60 dark:border-slate-700"
              }`}
              placeholder="Summarize the main findings for the generated document."
            />
            {isCommentInvalid && (
              <p className="text-xs font-medium text-red-600">Please fill out this field.</p>
            )}
          </section>

          <div className="pb-10">
            {submitErrorMessage &&
              !isOrderNumberInvalid &&
              !isSubjectNameInvalid &&
              !isCommentInvalid && (
              <div className="mb-4 w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {submitErrorMessage}
              </div>
            )}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary rounded-full px-6 py-2 text-base shadow-md"
              >
                {isSaving ? "Generating document..." : "Submit Evaluation"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default FormSubmit;
