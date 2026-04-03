import { AnimatePresence, motion } from "framer-motion";

type AuthModalProps = {
  title?: string;
  message: string;
  onClose: () => void;
};

export default function AuthModal({
  title = "localhost:5173 says",
  message,
  onClose,
}: AuthModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-20"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="w-full max-w-md rounded-3xl bg-[#24191d] px-5 py-6 text-white shadow-2xl"
        >
          <h3 className="text-[1.7rem] font-bold leading-none">{title}</h3>
          <p className="mt-5 text-base leading-relaxed text-white/95">{message}</p>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-w-20 rounded-full border-2 border-[#f2a8b8] bg-[#f6b4c1] px-7 py-2 text-base font-semibold text-[#4e2430] shadow-[0_0_0_2px_rgba(36,25,29,0.85)_inset] motion-safe:transition motion-safe:duration-200 motion-safe:ease-in-out motion-safe:hover:scale-105 motion-safe:hover:bg-[#f4a7b8] motion-safe:active:scale-95"
            >
              OK
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
