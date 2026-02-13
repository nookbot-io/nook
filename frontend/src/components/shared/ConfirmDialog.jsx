import { useEffect } from 'react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onCancel} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-surface border border-border-default rounded-xl p-6 max-w-sm w-full animate-scale-in">
          <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
          <p className="text-sm text-text-secondary mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="ghost-button text-sm">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                danger
                  ? 'bg-danger text-white hover:bg-danger/90'
                  : 'accent-button'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
