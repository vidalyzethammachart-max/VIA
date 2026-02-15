import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Type definitions
type RubricValue = number | null;
type RubricData = {
  [sectionId: string]: {
    [questionLabel: string]: RubricValue;
  };
};

type EvaluationRow = {
  id: number;
  rubric: RubricData; // JSONB
  created_at: string;
};

type QuestionStats = {
  label: string;
  count: number; // จำนวนผู้ตอบทั้งหมด
  scores: { [score: number]: number }; // จำนวนคนตอบแต่ละคะแนน (1-5)
  average: number;
};

type SectionStats = {
  id: string;
  title: string;
  questions: QuestionStats[];
};

// Section mapping (อาจจะดึงจาก config/sections.ts ในอนาคต)
const SECTION_TITLES: Record<string, string> = {
  "1": "ด้านบทเรียน (Script)",
  "2": "ด้านมุมกล้อง (Camera Angle)",
  "3": "ด้านองค์ประกอบภาพ (Composition)",
  "4": "ด้านผู้บรรยาย (Actor)",
  "5": "ด้านลำดับภาพ (Story Board)",
  "6": "ด้านฉาก (Scene)",
  "7": "ด้านแสง (Lighting)",
  "8": "ด้านเสียง (Sound)",
  "9": "ด้านกราฟิก (Graphic)",
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SectionStats[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("1"); // Default to section 1

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from("evaluations")
        .select("id, rubric, created_at");

      if (error) throw error;

      if (data) {
        processStats(data as EvaluationRow[]);
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const processStats = (evaluations: EvaluationRow[]) => {
    setTotalResponses(evaluations.length);

    const sectionMap = new Map<string, Map<string, number[]>>();

    evaluations.forEach((row) => {
      const rubric = row.rubric;
      if (!rubric) return;

      Object.entries(rubric).forEach(([sectionId, questions]) => {
        if (!questions) return;

        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, new Map());
        }

        const questionMap = sectionMap.get(sectionId)!;

        Object.entries(questions).forEach(([label, score]) => {
          if (score === null || score === undefined) return;

          if (!questionMap.has(label)) {
            questionMap.set(label, []);
          }
          questionMap.get(label)!.push(score);
        });
      });
    });

    const result: SectionStats[] = [];

    // Sort sections by ID (1-9)
    const sortedSectionIds = Array.from(sectionMap.keys()).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    sortedSectionIds.forEach((sectionId) => {
      const questionMap = sectionMap.get(sectionId)!;
      const questions: QuestionStats[] = [];

      questionMap.forEach((scores, label) => {
        const count = scores.length;
        const totalScore = scores.reduce((sum, s) => sum + s, 0);
        const average = count > 0 ? totalScore / count : 0;

        const scoreCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        scores.forEach((s) => {
          if (s >= 1 && s <= 5) scoreCounts[s as 1 | 2 | 3 | 4 | 5]++;
        });

        questions.push({
          label,
          count,
          scores: scoreCounts,
          average,
        });
      });

      result.push({
        id: sectionId,
        title: SECTION_TITLES[sectionId] || `Section ${sectionId}`,
        questions,
      });
    });

    setStats(result);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">กำลังประมวลผลข้อมูล...</div>
      </div>
    );
  }

  // Find active section data
  const activeSectionData = stats.find((s) => s.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard สรุปผลการประเมิน
          </h1>
          <p className="text-gray-500">
            จำนวนผู้ตอบแบบสอบถามทั้งหมด: {totalResponses} คน
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {Object.entries(SECTION_TITLES).map(([id, title]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "bg-[#04418b] text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeSectionData ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="bg-[#04418b] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {activeSectionData.title}
              </h2>
              <span className="text-white/80 text-sm">
                หัวข้อที่ {activeSectionData.id}
              </span>
            </div>

            <div className="p-6 space-y-10">
              {activeSectionData.questions.map((q, idx) => (
                <div key={idx} className="border-b border-gray-100 last:border-0 pb-8 last:pb-0">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Left: Chart */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        {q.label}
                      </h3>
                      
                      <div className="space-y-3 pt-2">
                        {[5, 4, 3, 2, 1].map((score) => {
                          const count = q.scores[score] || 0;
                          const percentage = q.count > 0 ? (count / q.count) * 100 : 0;
                          return (
                            <div key={score} className="flex items-center gap-3 text-sm">
                              <span className="w-4 text-right font-bold text-gray-500">
                                {score}
                              </span>
                              <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden relative group">
                                <div
                                  className="h-full rounded-md transition-all duration-500 relative flex items-center justify-end pr-2"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: getScoreColor(score),
                                    opacity: percentage > 0 ? 1 : 0.3,
                                  }}
                                >
                                </div>
                                {/* Tooltip on hover */}
                                <div className="absolute inset-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-xs font-semibold text-gray-700 bg-white/80 px-1 rounded shadow-sm">
                                    {count} คน ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              <span className="w-10 text-right text-gray-600 font-medium">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Score Summary */}
                    <div className="md:w-64 flex-shrink-0 flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <span className="text-gray-500 text-sm font-medium text-center mb-1">
                        {q.label} {/* ชื่อหัวข้อบนคะแนน */}
                      </span>
                      <div className="text-5xl font-bold text-[#04418b] my-2">
                        {q.average.toFixed(2)}
                      </div>
                      <span className="text-gray-400 text-xs">คะแนนเฉลี่ย (เต็ม 5)</span>
                      <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ผู้ตอบ {q.count} คน
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีข้อมูล</h3>
            <p className="mt-1 text-sm text-gray-500">
              ยังไม่มีข้อมูลการประเมินในหัวข้อนี้
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for colors (like Google Forms)
function getScoreColor(score: number): string {
  switch (score) {
    case 5: return "#4285F4"; // Blue
    case 4: return "#34A853"; // Green
    case 3: return "#FBBC05"; // Yellow
    case 2: return "#FA7B17"; // Orange
    case 1: return "#EA4335"; // Red
    default: return "#9AA0A6";
  }
}
