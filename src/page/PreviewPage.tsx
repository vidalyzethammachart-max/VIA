import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import MainNavbar from "../components/MainNavbar";

export default function PreviewPage() {
  const { docId } = useParams<{ docId: string }>();

  const urls = useMemo(() => {
    if (!docId) {
      return null;
    }

    return {
      preview: `https://docs.google.com/document/d/${docId}/preview`,
      edit: `https://docs.google.com/document/d/${docId}/edit`,
      pdf: `https://docs.google.com/document/d/${docId}/export?format=pdf`,
    };
  }, [docId]);

  if (!docId || !urls) {
    return <Navigate to="/my-forms" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavbar
        title="Document Preview"
        subtitle="Preview the generated Google Document inside the application."
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Generated document
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 md:text-xl">
                Google Doc preview
              </h2>
              <p className="mt-1 break-all text-sm text-slate-500">{docId}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={urls.edit}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#04418b] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#03326a]"
              >
                Open in Google Docs
              </a>
              <a
                href={urls.pdf}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Download PDF
              </a>
              <Link
                to="/my-forms"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to My Forms
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Google document preview"
            src={urls.preview}
            className="h-[800px] w-full"
          />
        </section>
      </main>
    </div>
  );
}
