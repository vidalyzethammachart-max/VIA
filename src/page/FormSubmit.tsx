import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { SECTIONS, LIKERT_LABELS, type LikertValue } from "../config/sections";
import { SectionCard } from "../components/SectionCard";
import {
  submitEvaluation,
  type Rubric,
  type EvaluationPayload,
} from "../services/evaluationService";
import { normalizeRole, type AppRole } from "../lib/roles";
import { roleRequestService } from "../services/roleRequestService";
import MainNavbar from "../components/MainNavbar";

import { Link } from "react-router-dom";

function FormSubmit() {
  const [orderNumber, setOrderNumber] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [answers, setAnswers] = useState<
    Record<string, Record<string, LikertValue | undefined>>
  >({});
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<AppRole>("user");
  const [isRequestingRole, setIsRequestingRole] = useState(false);
  const [roleRequestMessage, setRoleRequestMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setAuthUserId(user.id);
        
        supabase
          .from("user_information")
          .select("role")
          .eq("auth_user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            setUserRole(normalizeRole(data?.role));
          });
      }
    });
  }, []);

  // ---------------- Handlers ----------------

  const handleToggleAnswer = (
    sectionTitle: string,
    questionLabel: string,
    value: LikertValue,
  ) => {
    setAnswers((prev) => {
      const sectionAnswers = prev[sectionTitle] || {};
      const current = sectionAnswers[questionLabel];
      const nextValue = current === value ? undefined : value;

      return {
        ...prev,
        [sectionTitle]: {
          ...sectionAnswers,
          [questionLabel]: nextValue,
        },
      };
    });
  };

  // ---------------- Builders ----------------
  const buildRubric = (): Rubric => {
    const rubric: Rubric = {};

    SECTIONS.forEach((section) => {
      const sectionKey = section.id; // ✅ ใช้ id ของหมวด
      const sectionAnswers = answers[sectionKey] ?? {};

      rubric[sectionKey] = {}; // ✅ rubric key เป็น id

      section.questions.forEach((question) => {
        const questionKey = question.label; // ✅ ใช้ label (title ของคำถาม)
        const value = sectionAnswers[questionKey];

        rubric[sectionKey][questionKey] =
          typeof value === "number" ? value : null;
      });
    });

    return rubric;
  };

  const buildPayload = (): EvaluationPayload => ({
    user_id: authUserId ?? undefined,
    order_number: orderNumber.trim() || "ไม่ระบุลำดับ",
    subject_name: subjectName.trim() || "ไม่ระบุชื่อวิชา",
    overall_suggestion: comment.trim(),
    rubric: buildRubric(),
    Email: userEmail || undefined,
  });

  // ---------------- Submit ----------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSubmitErrorMessage(null);

    const payload = buildPayload();

    try {
      // ส่งแค่ Supabase อย่างเดียว
      await submitEvaluation(payload);

      console.log("✅ Saved payload:", payload);
      setShowSuccessModal(true);

      // เคลียร์ฟอร์มหลังจากบันทึกสำเร็จ
      setOrderNumber("");
      setSubjectName("");
      setAnswers({});
      setComment("");
    } catch (error) {
      console.error("❌ Error while saving:", error);
      setSubmitErrorMessage("เกิดข้อผิดพลาดขณะบันทึกข้อมูล ❌");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestEditorRole = async () => {
    if (!authUserId) return;

    setIsRequestingRole(true);
    setRoleRequestMessage(null);
    try {
      await roleRequestService.requestRole("editor");
      setRoleRequestMessage("Role request submitted. Please wait for admin review.");
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : "Failed to request role.";
      setRoleRequestMessage(message);
    } finally {
      setIsRequestingRole(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar />
      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        {userRole === "user" && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Need editor access?</h2>
            <p className="mt-1 text-xs text-slate-500">
              Submit a role request and admin will review it.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRequestEditorRole}
                disabled={isRequestingRole}
                className="rounded-lg bg-[#04418b] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-[#03326a] motion-safe:active:scale-[0.98]"
              >
                {isRequestingRole ? "Submitting..." : "Request Editor Role"}
              </button>
              <Link
                to="/role-requests"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.02] motion-safe:hover:bg-slate-100 motion-safe:active:scale-[0.98]"
              >
                View Requests
              </Link>
            </div>
            {roleRequestMessage && (
              <p className="mt-3 text-xs text-slate-600">{roleRequestMessage}</p>
            )}
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* การ์ด 1 : ลำดับ + ชื่อวิชา */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              {/* ลำดับ */}
              <div className="md:w-32 space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  หมายเลขวิชา
                </label>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="เช่น 1"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                />
              </div>

              {/* ชื่อวิชา */}
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  ชื่อวิดีโอ
                </label>
                <input
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="เช่น Video Test"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                />
              </div>
            </div>
          </section>

          {/* การ์ด 2 : คำชี้แจงการประเมิน */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm md:text-base font-semibold text-slate-900">
                คำชี้แจงการประเมิน
              </h2>
              <p className="text-xs md:text-sm text-slate-600">
                โปรดพิจารณาแต่ละข้อคำถาม แล้วให้คะแนนตามความเหมาะสม
                โดยใช้ระดับคะแนน 1–5 ตามเกณฑ์ต่อไปนี้
              </p>
            </div>

            {/* legend 1–5 */}
            <div className="flex flex-wrap gap-2 text-xs md:text-sm text-slate-600">
              {([1, 2, 3, 4, 5] as LikertValue[]).map((v) => (
                <div
                  key={v}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 border border-primary/20"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
                    {v}
                  </span>
                  <span>{LIKERT_LABELS[v]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* การ์ดหมวดประเมิน */}
          <section className="space-y-5">
            {SECTIONS.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                answers={answers[section.id] || {}}
                onToggle={(questionLabel, value) =>
                  handleToggleAnswer(section.id, questionLabel, value)
                }
              />
            ))}
          </section>

          {/* ข้อเสนอแนะรวม */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              ข้อเสนอแนะโดยรวมต่อวิดีโอการสอน
            </label>
            <p className="text-xs text-slate-500">
              ระบุความคิดเห็น ภาพรวม จุดเด่น จุดที่ควรปรับปรุง
              หรือข้อเสนอแนะอื่น ๆ ที่เห็นว่าสำคัญ
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary resize-none"
              placeholder="ตัวอย่าง: เนื้อหาชัดเจนดี แต่ช่วงอธิบายตัวอย่างที่ 2 อาจเร็วไปเล็กน้อย..."
            />
          </section>

          {/* ปุ่มส่งแบบประเมิน */}
          <div className="flex justify-center pb-10">
            {submitErrorMessage && (
              <div className="w-full max-w-md rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {submitErrorMessage}
              </div>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-full bg-primary text-white text-base font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.03] motion-safe:hover:bg-primary/90 motion-safe:active:scale-[0.97]"
            >
              {isSaving ? "กำลังบันทึก..." : "ส่งแบบประเมิน"}
            </button>
          </div>
        </form>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="bg-primary p-6 text-center relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

              <div className="relative z-10 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="relative z-10 text-xl font-bold text-white mb-1">
                บันทึกข้อมูลสำเร็จ
              </h3>
              <p className="relative z-10 text-white/90 text-sm font-medium">
                ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณครับ
              </p>
            </div>
            <div className="p-5 text-center bg-white">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-[1.01] motion-safe:hover:bg-slate-200 motion-safe:active:scale-[0.99]"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormSubmit;

