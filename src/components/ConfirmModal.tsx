import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmDisabled = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen || confirmDisabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDisabled, isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!confirmDisabled) onCancel();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-message"
          >
            <div className="bg-red-100 px-6 py-7">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-10.75a.75.75 0 00-1.5 0v4.25a.75.75 0 001.5 0V7.25zm0 7a.75.75 0 00-1.5 0v.25a.75.75 0 001.5 0v-.25z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              <h2
                id="confirm-modal-title"
                className="text-center text-xl font-bold text-slate-900"
              >
                {title}
              </h2>
              <p
                id="confirm-modal-message"
                className="mt-2 text-center text-sm leading-6 text-slate-500"
              >
                {message}
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={confirmDisabled}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-105 motion-safe:hover:bg-slate-100 motion-safe:active:scale-95"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-red-300 motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-105 motion-safe:hover:bg-red-700 motion-safe:active:scale-95"
                >
                  {confirmDisabled ? "Processing..." : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
