// src/App.tsx
import { useState } from "react";
import {
  SECTIONS,
  LIKERT_LABELS,
  type LikertValue,
  type Section,
} from "./config/sections";
import Logo from "./assets/logo.png";
import { SectionCard } from "./components/SectionCard";
import { saveEvaluation } from "./services/evaluationService";

type Rubric = Record<string, Record<string, number | null>>;

type EvaluationPayload = {
  order_number: string;
  subject_name: string;
  overall_suggestion: string;
  rubric: Rubric;
  // user_id?: string | null;
};

function App() {
  const [orderNumber, setOrderNumber] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [answers, setAnswers] = useState<
    Record<string, Record<string, LikertValue | undefined>>
  >({});
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleAnswer = (
    sectionId: string,
    questionId: string,
    value: LikertValue
  ) => {
    setAnswers((prev) => {
      const sectionAnswers = prev[sectionId] || {};
      const current = sectionAnswers[questionId];
      const nextValue = current === value ? undefined : value;

      return {
        ...prev,
        [sectionId]: {
          ...sectionAnswers,
          [questionId]: nextValue,
        },
      };
    });
  };

  const buildPayload = (): EvaluationPayload => {
    const rubric: Rubric = {};

    // SECTIONS มาจาก config/sections.ts ของคุณ
    SECTIONS.forEach((section) => {
      const sectionAnswers = answers[section.id] ?? {};
      rubric[section.id] = {};

      section.questions.forEach((question) => {
        const value = sectionAnswers[question.id];
        // undefined -> null
        rubric[section.id][question.id] =
          typeof value === "number" ? value : null;
      });
    });

    return {
      order_number: orderNumber.trim(),
      subject_name: subjectName.trim(),
      rubric,
      overall_suggestion: comment.trim(),
    };
  };


  const handleSubmit = async () => {
    const rubric: Rubric = {};

    SECTIONS.forEach((section: Section) => {
      rubric[section.id] = {};
      section.questions.forEach((q) => {
        const value = answers[section.id]?.[q.id];
        rubric[section.id][q.id] =
          typeof value === "number" ? (value as number) : null;
      });
    });

    const payload: EvaluationPayload = {
      order_number: orderNumber || "ไม่ระบุลำดับ",
      subject_name: subjectName || "ไม่ระบุชื่อวิชา",
      overall_suggestion: comment,
      rubric,
    };

    try {
      setIsSaving(true);
      const result = await saveEvaluation(payload);
      console.log("✅ Saved to Supabase:", result);
      alert("บันทึกข้อมูลสำเร็จ! 🎉");
      // ถ้าอยากเคลียร์ฟอร์มหลังบันทึก ค่อยมาเติม setState ตรงนี้ได้
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดขณะบันทึกข้อมูล ❌");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          {/* LOGO + TITLE */}
          <div className="flex items-center gap-3">
            <img
              src={Logo}
              alt="VIA Logo"
              className="h-10 w-auto rounded-md"
            />

            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wide text-primary">
                Video Intelligence &amp; Analytics
              </span>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900">
                แบบฟอร์มประเมินวิดีโอการสอน
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                กรุณาประเมินตามความเป็นจริง ข้อมูลนี้จะใช้เพื่อพัฒนาคุณภาพสื่อการสอน
              </p>
            </div>
          </div>


        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8 space-y-6">
        {/* การ์ด 1 : ลำดับ + ชื่อวิชา */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            {/* ลำดับ */}
            <div className="md:w-32 space-y-1">
              <label className="text-xs font-medium text-slate-700">
                ลำดับ
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
                ชื่อวิชา / รายวิชา
              </label>
              <input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="เช่น ฟิสิกส์ 1, คณิตศาสตร์พื้นฐาน, ภาษาอังกฤษเพื่อการสื่อสาร"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* การ์ด 2 : คำอธิบาย / เกณฑ์การให้คะแนน */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              คำชี้แจงการประเมิน
            </h2>
            <p className="text-xs md:text-sm text-slate-600">
              โปรดพิจารณาแต่ละข้อคำถาม แล้วให้คะแนนตามความเหมาะสม โดยใช้ระดับคะแนน
              1–5 ตามเกณฑ์ต่อไปนี้
            </p>
          </div>

          {/* แสดง legend 1–5 แบบแคปซูล */}
          <div className="flex flex-wrap gap-2 text-xs md:text-sm text-slate-600">
            {([5, 4, 3, 2, 1] as LikertValue[]).map((v) => (
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
              onToggle={(questionId, value) =>
                handleToggleAnswer(section.id, questionId, value)
              }
            />
          ))}
        </section>

        {/* ข้อเสนอแนะรวม */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-2 mb-10">
          <label className="text-sm font-semibold text-slate-800">
            ข้อเสนอแนะโดยรวมต่อวิดีโอการสอน
          </label>
          <p className="text-xs text-slate-500">
            ระบุความคิดเห็น ภาพรวม จุดเด่น จุดที่ควรปรับปรุง หรือข้อเสนอแนะอื่น ๆ
            ที่เห็นว่าสำคัญ
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
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 rounded-full bg-primary text-white text-base font-semibold hover:bg-primary/90 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "กำลังบันส่ง..." : "ส่งแบบประเมิน"}
          </button>
        </div>

      </main>
    </div>
  );
}

export default App;
