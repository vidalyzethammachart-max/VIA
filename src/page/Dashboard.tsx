import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { SECTIONS } from "../config/sections";
import { accountingService } from "../services/accountingService";
import MainNavbar from "../components/MainNavbar";
import { useAuthRole } from "../hooks/useAuthRole";
import { roleAtLeast } from "../lib/roles";

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

// Section mapping imported from config/sections.ts

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useAuthRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SectionStats[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [activeTab, setActiveTab] = useState<string>(SECTIONS[0]?.id || "1"); // Default to section 1
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");

  const fetchEvaluations = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      let query = supabase
        .from("evaluations")
        .select("id, rubric, created_at");

      if (!roleAtLeast(role ?? "user", "editor")) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        processStats(data as EvaluationRow[]);
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate, role]);

  useEffect(() => {
    if (!role) {
      return;
    }

    const run = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          navigate("/", { replace: true });
          return;
        }

        void accountingService.logActivity({
          user_id: user.id,
          action: "dashboard.viewed",
          resource: "dashboard",
        }).catch((logError) => {
          console.error("Activity log failed:", logError);
        });

        await fetchEvaluations();
      } catch (error) {
        console.error("Access check failed", error);
        navigate("/form-submit", { replace: true });
      }
    };

    void run();
  }, [fetchEvaluations, navigate, role]);

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

    SECTIONS.forEach((sectionConf) => {
      const sectionId = sectionConf.id;
      const questionMap = sectionMap.get(sectionId) || new Map();
      const questions: QuestionStats[] = [];

      sectionConf.questions.forEach((qConf) => {
        const label = qConf.label;
        const scores: number[] = questionMap.get(label) || [];

        const count = scores.length;
        const totalScore = scores.reduce((sum: number, s: number) => sum + s, 0);
        const average = count > 0 ? totalScore / count : 0;

        const scoreCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        scores.forEach((s: number) => {
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
        title: sectionConf.title,
        questions,
      });
    });

    setStats(result);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Find active section data
  const activeSectionData = stats.find((s) => s.id === activeTab);

    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard สรุปผลการประเมิน
          </h1>
          <p className="text-gray-500">
            จำนวนผู้ตอบแบบสอบถามทั้งหมด: {totalResponses} คน
          </p>
        </div>

        {/* Controls Section */}
        <div className="mb-8 flex flex-col xl:flex-row justify-between items-start gap-6">
          {/* Section Selection (Buttons) */}
          <div className="flex-1 w-full">
            <span className="text-sm font-medium text-gray-500 mb-2 block">
              เลือกหัวข้อประเมิน:
            </span>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`ui-hover-button px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    activeTab === section.id
                      ? "bg-[#04418b] text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Chart View Switcher */}
          <div className="w-full xl:w-auto flex-shrink-0">
            <span className="text-sm font-medium text-gray-500 mb-2 block">
              รูปแบบการแสดงผล:
            </span>
            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
              <button
                onClick={() => setChartType("bar")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
                  chartType === "bar"
                    ? "bg-blue-50 text-[#04418b]"
                    : "text-gray-500"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Bar Chart
              </button>
              <button
                onClick={() => setChartType("donut")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
                  chartType === "donut"
                    ? "bg-blue-50 text-[#04418b]"
                    : "text-gray-500"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                Donut Chart
              </button>
            </div>
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
                <div
                  key={idx}
                  className="border-b border-slate-300 last:border-0 pb-8 last:pb-0"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Left: Chart */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        {idx + 1}. {q.label}
                      </h3>

                      {chartType === "bar" ? (
                        <div className="space-y-3 pt-2">
                          {[5, 4, 3, 2, 1].map((score) => {
                            const count = q.scores[score] || 0;
                            const percentage =
                              q.count > 0 ? (count / q.count) * 100 : 0;
                            return (
                              <div
                                key={score}
                                className="flex items-center gap-3 text-sm"
                              >
                                <span className="w-12 text-right font-medium text-gray-500">
                                  {score} คะแนน
                                </span>
                                <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative group">
                                  <div
                                    className="h-full rounded-md transition-all duration-500 relative flex items-center"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: getScoreColor(score),
                                      opacity: percentage > 0 ? 1 : 0.3,
                                    }}
                                  ></div>
                                  {/* Percentage Label */}
                                  {percentage > 0 && (
                                    <div className="absolute inset-0 flex items-center px-2">
                                      <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                        {percentage.toFixed(0)}%
                                      </span>
                                    </div>
                                  )}
                                  {/* Tooltip on hover */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="text-[10px] font-bold text-gray-700 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                                      {count} คน
                                    </span>
                                  </div>
                                </div>
                                <span className="w-8 text-right text-gray-600 font-medium">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                          {/* Donut Chart SVG SVG */}
                          <div className="relative w-48 h-48">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full transform -rotate-90"
                            >
                              {(() => {
                                let cumulativePercentage = 0;
                                return [5, 4, 3, 2, 1].map((score) => {
                                  const count = q.scores[score] || 0;
                                  const percentage =
                                    q.count > 0 ? (count / q.count) * 100 : 0;
                                  if (percentage === 0) return null;

                                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                                  const strokeDashoffset =
                                    -cumulativePercentage;
                                  cumulativePercentage += percentage;

                                  return (
                                    <circle
                                      key={score}
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      fill="transparent"
                                      stroke={getScoreColor(score)}
                                      strokeWidth="20"
                                      strokeDasharray={strokeDasharray}
                                      strokeDashoffset={strokeDashoffset}
                                      className="transition-all duration-700 ease-out"
                                    />
                                  );
                                });
                              })()}
                              {/* Inner Circle to make it a donut */}
                              <circle cx="50" cy="50" r="30" fill="white" />
                            </svg>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-gray-800">
                                {q.average.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-gray-400 capitalize">
                                Average
                              </span>
                            </div>
                          </div>

                          {/* Legend for Donut */}
                          <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2">
                            {[5, 4, 3, 2, 1].map((score) => {
                              const count = q.scores[score] || 0;
                              const percentage =
                                q.count > 0 ? (count / q.count) * 100 : 0;
                              return (
                                <div
                                  key={score}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: getScoreColor(score),
                                    }}
                                  />
                                  <span className="text-gray-600 min-w-[50px]">
                                    {score} คะแนน:
                                  </span>
                                  <span className="font-bold text-gray-800">
                                    {count}
                                  </span>
                                  <span className="text-gray-400">
                                    ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Score Summary */}
                    <div className="md:w-64 flex-shrink-0 flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-slate-300">
                      <span className="text-gray-500 text-sm font-medium text-center mb-1">
                        คะแนนเฉลี่ย
                      </span>
                      <div className="text-5xl font-bold text-[#04418b] my-2">
                        {q.average.toFixed(2)}
                      </div>
                      <span className="text-gray-400 text-xs">
                        จากเต็ม 5 คะแนน
                      </span>
                      <div className="mt-4 w-full h-px bg-slate-300"></div>
                      <div className="mt-4 flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-700">
                          {q.count}
                        </span>
                        <span className="text-gray-400 text-xs">
                          ผู้ตอบประเมิน
                        </span>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              ไม่มีข้อมูล
            </h3>
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
    case 5:
      return "#4285F4"; // Blue
    case 4:
      return "#34A853"; // Green
    case 3:
      return "#FBBC05"; // Yellow
    case 2:
      return "#FA7B17"; // Orange
    case 1:
      return "#EA4335"; // Red
    default:
      return "#9AA0A6";
  }
}


