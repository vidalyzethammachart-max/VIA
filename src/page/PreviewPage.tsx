import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";

import MainNavbar from "../components/MainNavbar";
import { supabase } from "../lib/supabaseClient";

type PreviewRecord = {
  id: number;
  subject_name: string | null;
  google_doc_id: string | null;
  source_doc_id: string | null;
  pdf_storage_path: string | null;
  docx_storage_path: string | null;
  document_status: "pending" | "ready" | "failed";
  document_error: string | null;
  created_at: string;
};

type ArtifactUrls = {
  source: "storage" | "google";
  previewUrl: string | null;
  pdfUrl: string | null;
  docxUrl: string | null;
};

export default function PreviewPage() {
  const location = useLocation();
  const { docId } = useParams<{ docId: string }>();
  const evaluationId = Number(docId);
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<PreviewRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [artifactUrls, setArtifactUrls] = useState<ArtifactUrls | null>(null);
  const [artifactLoading, setArtifactLoading] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      if (!Number.isInteger(evaluationId) || evaluationId <= 0) {
        setErrorMessage("Invalid preview request.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("evaluations")
        .select("id, subject_name, google_doc_id, source_doc_id, pdf_storage_path, docx_storage_path, document_status, document_error, created_at")
        .eq("id", evaluationId)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage("Preview not found.");
        setLoading(false);
        return;
      }

      setRecord(data as PreviewRecord);
      setLoading(false);
    };

    void loadPreview();
  }, [evaluationId]);

  useEffect(() => {
    if (!record || record.document_status !== "pending") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("id, subject_name, google_doc_id, source_doc_id, pdf_storage_path, docx_storage_path, document_status, document_error, created_at")
        .eq("id", evaluationId)
        .maybeSingle();

      if (!error && data) {
        setRecord(data as PreviewRecord);
      }
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [evaluationId, record]);

  useEffect(() => {
    const loadArtifactUrls = async () => {
      if (!record || record.document_status !== "ready") {
        setArtifactUrls(null);
        return;
      }

      setArtifactLoading(true);

      const { data, error } = await supabase.functions.invoke<{
        ok: boolean;
        source: "storage" | "google";
        previewUrl: string | null;
        pdfUrl: string | null;
        docxUrl: string | null;
        error?: string;
      }>("document-artifact-url", {
        body: { evaluationId: record.id },
      });

      if (error || !data?.ok) {
        setArtifactUrls(null);
        setErrorMessage(
          data?.error || error?.message || "Failed to resolve document artifact URLs.",
        );
        setArtifactLoading(false);
        return;
      }

      setArtifactUrls({
        source: data.source,
        previewUrl: data.previewUrl,
        pdfUrl: data.pdfUrl,
        docxUrl: data.docxUrl,
      });
      setArtifactLoading(false);
    };

    void loadArtifactUrls();
  }, [record]);

  const fallbackGoogleUrls = useMemo(() => {
    if (!record?.google_doc_id) {
      return null;
    }

    return {
      preview: `https://docs.google.com/document/d/${record.google_doc_id}/preview`,
      docx: `https://docs.google.com/document/d/${record.google_doc_id}/export?format=docx`,
      pdf: `https://docs.google.com/document/d/${record.google_doc_id}/export?format=pdf`,
    };
  }, [record?.google_doc_id]);

  if (!docId) {
    return <Navigate to="/my-forms" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar
        title="Document Preview"
        subtitle="Preview the generated Google Document linked to this evaluation."
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:py-8">
        <section className="ui-hover-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Evaluation document
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 md:text-xl">
                {record?.subject_name || "Generated Google Doc"}
              </h2>
              {location.state && "generated" in (location.state as Record<string, unknown>) && (
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  Document generated successfully.
                </p>
              )}
              {artifactUrls?.source === "storage" && (
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Preview source: stored PDF artifact
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {artifactUrls && record?.document_status === "ready" && (
                <>
                  {artifactUrls.docxUrl && (
                    <a
                      href={artifactUrls.docxUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-center"
                    >
                      Download DOCX
                    </a>
                  )}
                  {artifactUrls.pdfUrl && (
                    <a
                      href={artifactUrls.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-center"
                    >
                      Download PDF
                    </a>
                  )}
                </>
              )}
              <Link
                to="/my-forms"
                className="btn-secondary text-center"
              >
                Back to My Forms
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading preview...
          </section>
        ) : errorMessage ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm">
            {errorMessage}
          </section>
        ) : record?.document_status === "failed" ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <h3 className="text-base font-semibold text-red-800">Document generation failed</h3>
            <p className="mt-2 text-sm text-red-700">
              {record.document_error || "The generator did not return a document."}
            </p>
          </section>
        ) : record?.document_status !== "ready" || artifactLoading ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <h3 className="text-base font-semibold text-amber-900">Document still processing</h3>
            <p className="mt-2 text-sm text-amber-800">
              The evaluation was saved. This page checks for updates automatically every few seconds.
            </p>
          </section>
        ) : artifactUrls?.previewUrl ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <iframe
              title="Generated document preview"
              src={artifactUrls.previewUrl}
              className="h-[800px] w-full"
            />
          </section>
        ) : fallbackGoogleUrls ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <iframe
              title="Google document preview"
              src={fallbackGoogleUrls.preview}
              className="h-[800px] w-full"
            />
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            No preview artifact is available yet.
          </section>
        )}
      </main>
    </div>
  );
}
