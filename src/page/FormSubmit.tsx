import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { SECTIONS, LIKERT_LABELS, type LikertValue } from "../config/sections";
import Logo from "../assets/logo.png";
import { SectionCard } from "../components/SectionCard";
import {
  submitEvaluation,
  type Rubric,
  type EvaluationPayload,
} from "../services/evaluationService";

import ProfileDropdown from "../components/ProfileDropdown";
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        
        supabase
          .from("user_information")
          .select("role")
          .eq("auth_user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.role === "admin") setIsAdmin(true);
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
      alert("เกิดข้อผิดพลาดขณะบันทึกข้อมูล ❌");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="w-full px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-row items-center gap-3 w-full">
            <img src={Logo} alt="VIA Logo" className="h-10 w-auto rounded-md" />

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wide text-primary">
                Video Intelligence & Analytics
              </span>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900">
                ประเมินและวิเคราะห์วิดีโออัจฉริยะ
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                ระบบประเมินคุณภาพสื่อดิจิทัลด้านเทคนิคเพื่อการศึกษา
              </p>
            </div>

            {/* badge */}
            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className="group flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 rounded-full bg-slate-50/50 border border-slate-200 shadow-sm hover:bg-white hover:border-slate-300 hover:shadow transition-all duration-300"
                  title="ไปหน้า Dashboard"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110 duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <rect x="3" y="12" width="5" height="10" rx="1.5" fill="#93C5FD" className="group-hover:fill-blue-400 transition-colors duration-300" />
                    <rect x="9.5" y="7" width="5" height="15" rx="1.5" fill="#FCA5A5" className="group-hover:fill-red-400 transition-colors duration-300" />
                    <rect x="16" y="3" width="5" height="19" rx="1.5" fill="#C4B5FD" className="group-hover:fill-purple-400 transition-colors duration-300" />
                  </svg>
                  <span className="hidden sm:inline-block font-medium text-sm text-slate-600 group-hover:text-slate-900 transition-colors duration-300">
                    Dashboard
                  </span>
                </Link>
              )}
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
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
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-full bg-primary text-white text-base font-semibold hover:bg-primary/90 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? "กำลังบันทึก..." : "ส่งแบบประเมิน"}
            </button>
          </div>
        </form>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
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
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
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
