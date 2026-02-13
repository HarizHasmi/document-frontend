import { extractRole } from '../utils/user'
import { titleCase } from '../utils/format'

const roleStyles = {
  admin: 'bg-[#ece9ff] text-[#5b4ce8]',
  manager: 'bg-[#e6f8ff] text-[#0072a8]',
  employee: 'bg-[#eef4ff] text-[#3f5cae]',
}

export default function RoleBadge({ user }) {
  const role = extractRole(user) ?? 'employee'
  const style = roleStyles[role] ?? roleStyles.employee

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>
      {titleCase(role)}
    </span>
  )
}
