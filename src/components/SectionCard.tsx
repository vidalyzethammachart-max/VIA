import type { LikertValue, Question, Section } from "../config/sections";

type Props = {
  section: Section;
  answers: Record<string, LikertValue | undefined>;
  onToggle: (questionId: string, value: LikertValue) => void;
};

const RATING_HEADERS: { value: LikertValue; label: string }[] = [
  { value: 1, label: "น้อยที่สุด" },
  { value: 2, label: "น้อย" },
  { value: 3, label: "ปานกลาง" },
  { value: 4, label: "มาก" },
  { value: 5, label: "มากที่สุด" },
];

export function SectionCard({ section, answers, onToggle }: Props) {
  return (
    <div className="ui-hover-card bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 space-y-4">
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
        {/* Header แบบเอกสาร (แสดงเฉพาะบน Desktop) */}
        <div className="hidden md:grid bg-slate-50 border-b border-slate-200 grid-cols-[50%_repeat(5,10%)] text-[10px] md:text-xs text-slate-600">
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
              className="flex flex-col md:grid md:grid-cols-[50%_repeat(5,10%)] bg-white"
            >
              {/* ข้อคำถาม */}
              <div className="px-3 md:px-4 py-3 flex items-start gap-2">
                <span className="mt-0.5 text-[11px] text-slate-400">
                  {idx + 1}.
                </span>
                <p className="text-slate-700 font-medium md:font-normal">
                  {q.label}
                </p>
              </div>

              {/* ปุ่มให้คะแนน */}
              <div className="flex border-t border-slate-50 md:border-t-0 md:contents">
                {[1, 2, 3, 4, 5].map((value) => {
                  const selected = answers[q.label] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onToggle(q.label, value as LikertValue)}
                      className={`flex-1 md:flex-none flex items-center justify-center border-l first:border-l-0 md:first:border-l border-slate-100 py-3 md:py-2 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out ${
                        selected ? "bg-primary/5" : "bg-white motion-safe:hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`inline-flex h-8 w-8 md:h-7 md:w-7 items-center justify-center rounded-full border text-sm font-semibold motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out ${
                          selected
                            ? "bg-primary border-primary text-white shadow-sm motion-safe:scale-105"
                            : "bg-white border-slate-300 text-slate-400/60"
                        }`}
                      >
                          {selected ? "✓" : <><span className="md:hidden">{value}</span></>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
