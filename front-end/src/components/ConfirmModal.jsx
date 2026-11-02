function ConfirmModal({ title, message, confirmText = 'Confirm', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-lg bg-white p-6"
        onKeyDown={(event) => {
          if (event.key === 'Escape') (onCancel || onConfirm)()
        }}
      >
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-3">{message}</p>
        <div className="mt-5 flex gap-3">
          {onCancel && (
            <button autoFocus onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 p-3">
              Cancel
            </button>
          )}
          <button
            autoFocus={!onCancel}
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-nyu-violet p-3 font-semibold text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
