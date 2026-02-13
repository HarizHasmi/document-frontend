const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-[3px]',
  lg: 'h-10 w-10 border-4',
}

export default function Spinner({ size = 'md', label = 'Loading...' }) {
  const spinnerSize = sizeMap[size] ?? sizeMap.md

  return (
    <div className="inline-flex items-center gap-2 text-[#4a5571]">
      <span
        className={`${spinnerSize} animate-spin rounded-full border-[#d8e4ff] border-t-[#4880ff]`}
        aria-hidden="true"
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  )
}
