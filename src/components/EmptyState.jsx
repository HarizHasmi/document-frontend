export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d7e0ef] bg-[#f9fbff] px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-[#202224]">{title}</h3>
      <p className="mt-2 text-sm text-[#8a92a6]">{description}</p>
    </div>
  )
}
