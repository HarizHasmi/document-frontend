import { useCallback, useEffect, useState } from 'react'
import { login as loginApi, logout as logoutApi, fetchUser } from '../api/auth'
import { normalizeUser } from '../utils/user'
import AuthContext from './context'
import { unwrapResource } from '../utils/api'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))

  const refreshUser = useCallback(async () => {
    const profile = await fetchUser()
    const normalized = normalizeUser(profile)
    setUser(normalized)
    return normalized
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser()
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [refreshUser])

  const login = async (email, password) => {
    const data = await loginApi(email, password)
    if (data?.token) {
      localStorage.setItem('token', data.token)
    }

    if (data?.user) {
      const normalized = normalizeUser(unwrapResource(data.user))
      setUser(normalized)
      return normalized
    }

    return refreshUser()
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch {
      // Ignore API logout errors and clear local auth state.
    }
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
