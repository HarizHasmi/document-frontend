export function extractRole(user) {
  if (!user) return null

  if (typeof user.role === 'string' && user.role.trim()) {
    return user.role
  }

  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0]
    if (typeof firstRole === 'string') return firstRole
    if (firstRole && typeof firstRole.name === 'string') return firstRole.name
  }

  if (typeof user.role_name === 'string' && user.role_name.trim()) {
    return user.role_name
  }

  if (typeof user.user_type === 'string' && user.user_type.trim()) {
    return user.user_type
  }

  return null
}

export function normalizeUser(user) {
  if (!user) return null

  return {
    ...user,
    role: extractRole(user) ?? 'employee',
  }
}

export function canUploadDocuments(user) {
  const role = extractRole(user) ?? user?.role
  return role === 'admin' || role === 'manager'
}

export function canManageDocument(user, document) {
  const role = extractRole(user) ?? user?.role

  if (role === 'admin') return true
  if (role === 'manager') return Number(document?.uploaded_by) === Number(user?.id)

  return false
}
