import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export type ToastKind = 'info' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

export const ToastStack = ({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) => (
  <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`glass-panel px-4 py-3 rounded-xl border border-white/10 shadow-lg text-sm ${toast.kind === 'error' ? 'bg-red-500/30' : 'bg-white/10'}`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5">{toast.kind === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span className="leading-snug text-white/90">{toast.message}</span>
            <button className="text-white/60 text-xs ml-auto" onClick={() => onClose(toast.id)}>
              閉じる
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const push = (message: string, kind: ToastKind = 'info', duration = 3200) => {
    const id = crypto.randomUUID();
    const toast: ToastItem = { id, message, kind };
    setToasts((list) => [...list, toast]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
      }, duration);
    }
  };

  const remove = (id: string) => setToasts((list) => list.filter((t) => t.id !== id));

  return { toasts, push, remove };
};
