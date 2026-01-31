import type { LikertValue, Question, Section } from "../config/sections";

type Props = {
  section: Section;
  answers: Record<string, LikertValue | undefined>;
  onToggle: (questionId: string, value: LikertValue) => void;
};

const RATING_HEADERS: { value: LikertValue; label: string }[] = [
  { value: 5, label: "มากที่สุด" },
  { value: 4, label: "มาก" },
  { value: 3, label: "ปานกลาง" },
  { value: 2, label: "น้อย" },
  { value: 1, label: "น้อยที่สุด" },
];

export function SectionCard({ section, answers, onToggle }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
      {/* หัวหมวด */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
            {section.id}
          </span>
          <h3 className="text-sm md:text-base font-semibold text-slate-900">
            {section.title}
          </h3>
        </div>
        {section.description && (
          <p className="text-xs md:text-sm text-slate-500">
            {section.description}
          </p>
        )}
      </div>

      {/* ตารางประเมิน */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header แบบเอกสาร */}
        <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-[50%_repeat(5,10%)] text-[10px] md:text-xs text-slate-600">
          <div className="px-3 md:px-4 py-2 flex items-center font-medium">
            รายละเอียดการประเมิน
          </div>
          {RATING_HEADERS.map((h) => (
            <div
              key={h.value}
              className="flex flex-col items-center justify-center border-l border-slate-200 px-1 py-1.5"
            >
              <span>{h.label}</span>
              <span className="text-[9px] md:text-[10px] text-slate-400">
                ({h.value})
              </span>
            </div>
          ))}
        </div>

        {/* แถวคำถาม */}
        <div className="divide-y divide-slate-100 text-xs md:text-sm">
          {section.questions.map((q: Question, idx: number) => (
            <div
              key={q.id}
              className="grid grid-cols-[50%_repeat(5,10%)]"
            >
              {/* ข้อคำถาม */}
              <div className="px-3 md:px-4 py-3 flex items-start gap-2 bg-white">
                <span className="mt-0.5 text-[11px] text-slate-400">
                  {idx + 1}.
                </span>
                <p className="text-slate-700">{q.label}</p>
              </div>

              {/* ปุ่ม ✓ */}
              {[5, 4, 3, 2, 1].map((value) => {
                const selected = answers[q.label] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onToggle(q.label, value as LikertValue)}
                    className={`flex items-center justify-center border-l border-slate-100 py-2 transition ${
                      selected ? "bg-primary/5" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${
                        selected
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-slate-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
