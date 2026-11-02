// notifications at bottom of screen
function Toast({ message }) {
  if (!message) return null

  return (
    <p
      role="status"
      className="fixed inset-x-4 bottom-24 z-20 mx-auto max-w-md rounded-lg bg-[#21152b] px-4 py-3 text-sm text-white shadow-lg"
    >
      {message}
    </p>
  )
}

export default Toast
