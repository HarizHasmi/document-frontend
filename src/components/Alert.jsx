const toneClasses = {
  success: 'border-[#c9f4e8] bg-[#f1fcf8] text-[#008767]',
  error: 'border-[#ffc8d3] bg-[#fff1f4] text-[#d13f60]',
  info: 'border-[#d3e2ff] bg-[#f4f8ff] text-[#4060c4]',
}

export default function Alert({ type = 'info', message }) {
  if (!message) return null

  const classes = toneClasses[type] ?? toneClasses.info

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${classes}`} role="alert">
      {message}
    </div>
  )
}
