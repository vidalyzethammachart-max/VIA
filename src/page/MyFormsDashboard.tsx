import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import MainNavbar from "../components/MainNavbar";
import { supabase } from "../lib/supabaseClient";

type EvaluationItem = {
  id: number;
  user_id: string | null;
  order_number: string | null;
  subject_name: string | null;
  overall_suggestion: string | null;
  google_doc_id: string | null;
  source_doc_id: string | null;
  pdf_storage_path: string | null;
  docx_storage_path: string | null;
  document_status: "pending" | "ready" | "failed";
  document_error: string | null;
  created_at: string;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export default function MyFormsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDownloadKey, setActiveDownloadKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EvaluationItem["document_status"]>("all");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    void loadMyForms();
  }, []);

  const loadMyForms = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("evaluations")
        .select("id, user_id, order_number, subject_name, overall_suggestion, google_doc_id, source_doc_id, pdf_storage_path, docx_storage_path, document_status, document_error, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setItems((data ?? []) as EvaluationItem[]);
    } catch (error) {
      console.error("Failed to load my forms:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to load forms.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (evaluationId: number, format: "pdf" | "docx") => {
    const downloadKey = `${evaluationId}:${format}`;

    try {
      setActiveDownloadKey(downloadKey);

      const { data, error } = await supabase.functions.invoke<{
        ok: boolean;
        pdfUrl: string | null;
        docxUrl: string | null;
        error?: string;
      }>("document-artifact-url", {
        body: { evaluationId },
      });

      if (error || !data?.ok) {
        throw new Error(data?.error || error?.message || "Failed to prepare download.");
      }

      const targetUrl = format === "pdf" ? data.pdfUrl : data.docxUrl;
      if (!targetUrl) {
        throw new Error(`No ${format.toUpperCase()} artifact is available for this evaluation.`);
      }

      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(`Failed to download ${format}:`, error);
      setErrorMessage(error instanceof Error ? error.message : `Failed to download ${format.toUpperCase()}.`);
    } finally {
      setActiveDownloadKey(null);
    }
  };

  const completedPreviewCount = items.filter((item) => item.document_status === "ready").length;
  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.document_status === statusFilter;

    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return matchesStatus;
    }

    const haystack = [
      item.subject_name,
      item.order_number,
      item.overall_suggestion,
      item.document_status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && haystack.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar
        title="My Forms Dashboard"
        subtitle="Track how many evaluation forms you have submitted and preview linked documents."
      />

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="ui-hover-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Total forms
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{items.length}</p>
            <p className="mt-2 text-sm text-slate-500">Forms submitted by your account.</p>
          </div>

          <div className="ui-hover-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Ready to preview
            </p>
            <p className="mt-3 text-4xl font-bold text-sky-600 dark:text-sky-400">
              {completedPreviewCount}
            </p>
            <p className="mt-2 text-sm text-slate-500">Entries that already have generated preview files.</p>
          </div>

          <div className="ui-hover-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Quick action
            </p>
            <Link
              to="/form-submit"
              className="btn-primary mt-3 inline-flex"
            >
              Submit new form
            </Link>
            <p className="mt-2 text-sm text-slate-500">Create another evaluation submission.</p>
          </div>
        </section>

        <section className="ui-hover-card mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">My submissions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Each row is one evaluation form submitted by your account.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject, order no., note..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#04418b]/30 focus:ring-4 focus:ring-[#04418b]/5 sm:w-72"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | EvaluationItem["document_status"],
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#04418b]/30 focus:ring-4 focus:ring-[#04418b]/5"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="ready">Ready</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Loading your forms...
            </div>
          ) : errorMessage ? (
            <div className="px-5 py-12 text-center text-sm text-red-600">{errorMessage}</div>
          ) : items.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              You have not submitted any forms yet.
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No submissions match the current search or filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="ui-hover-card flex flex-col gap-4 px-5 py-5 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {item.subject_name || "Untitled submission"}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        #{item.order_number || "-"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(item.created_at)}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {item.overall_suggestion?.trim() || "No overall suggestion provided."}
                    </p>
                    {item.document_status === "ready" && (item.pdf_storage_path || item.docx_storage_path || item.google_doc_id) ? (
                      <p className="mt-3 break-all text-xs text-slate-400">
                        {item.pdf_storage_path || item.docx_storage_path
                          ? `Stored artifact: ${item.pdf_storage_path || item.docx_storage_path}`
                          : "Generated document is ready."}
                      </p>
                    ) : item.document_status === "failed" ? (
                      <p className="mt-3 text-xs font-medium text-red-600">
                        Generation failed: {item.document_error || "No error details were stored."}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs font-medium text-amber-600">
                        Preview pending: the generated Google Doc is still being processed.
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {item.document_status === "ready" && (item.pdf_storage_path || item.docx_storage_path || item.google_doc_id) ? (
                      <>
                        <Link
                          to={`/preview/${item.id}`}
                          className="btn-primary text-center"
                        >
                          Preview
                        </Link>
                        {item.pdf_storage_path && (
                          <button
                            type="button"
                            onClick={() => void handleDownload(item.id, "pdf")}
                            disabled={activeDownloadKey === `${item.id}:pdf`}
                            className="btn-secondary text-center"
                          >
                            {activeDownloadKey === `${item.id}:pdf` ? "Preparing PDF..." : "Download PDF"}
                          </button>
                        )}
                        {item.docx_storage_path && (
                          <button
                            type="button"
                            onClick={() => void handleDownload(item.id, "docx")}
                            disabled={activeDownloadKey === `${item.id}:docx`}
                            className="btn-secondary text-center"
                          >
                            {activeDownloadKey === `${item.id}:docx` ? "Preparing DOCX..." : "Download DOCX"}
                          </button>
                        )}
                        {item.source_doc_id && (
                          <a
                            href={`https://docs.google.com/document/d/${item.source_doc_id}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary text-center"
                          >
                            Open Source Doc
                          </a>
                        )}
                      </>
                    ) : item.document_status === "failed" ? (
                      <Link
                        to={`/preview/${item.id}`}
                        className="btn-danger text-center"
                      >
                        View Error
                      </Link>
                    ) : (
                      <Link
                        to={`/preview/${item.id}`}
                        className="btn-secondary text-center"
                      >
                        Track Status
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
