export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-[#ef4444] hover:bg-[#dc2626] focus-visible:outline-[#ef4444]'
      : 'bg-[#4880ff] hover:bg-[#3d70e0] focus-visible:outline-[#4880ff]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#e8ecf4] bg-white p-6 shadow-[0_18px_40px_rgba(17,24,39,0.14)]">
        <h3 className="text-lg font-semibold text-[#202224]">{title}</h3>
        <p className="mt-2 text-sm text-[#8a92a6]">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#d9e2f1] px-4 py-2 text-sm font-medium text-[#4a5571] hover:bg-[#f2f6ff]"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmClass}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
