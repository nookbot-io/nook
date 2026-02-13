import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

let addToastFn = null;

export function showToast(message, type = 'info') {
  if (addToastFn) addToastFn({ message, type, id: Date.now() });
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  const borderColor = (type) => {
    if (type === 'success') return 'border-l-success';
    if (type === 'error') return 'border-l-danger';
    return 'border-l-accent';
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 items-center">
      {toasts.map((toast) => {
        const Icon = toast.type === 'error' ? XCircle : toast.type === 'success' ? CheckCircle : AlertCircle;

        return (
          <div
            key={toast.id}
            className={`animate-slide-up shadow-lg rounded-lg overflow-hidden max-w-sm w-full border border-border-default ${borderColor(toast.type)} border-l-2 bg-surface`}
          >
            <div className="px-4 py-3 flex items-start gap-3">
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                toast.type === 'success' ? 'text-success' : toast.type === 'error' ? 'text-danger' : 'text-accent'
              }`} />
              <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-0.5 rounded hover:bg-elevated transition-colors text-text-tertiary"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-0.5 bg-border-subtle">
              <div className={`h-full animate-shrink ${
                toast.type === 'success' ? 'bg-success' : toast.type === 'error' ? 'bg-danger' : 'bg-accent'
              }`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
