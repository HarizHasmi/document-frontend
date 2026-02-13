import { useEffect, useMemo, useState } from 'react'
import useAuth from '../auth/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'
import { extractApiError } from '../utils/api'

export default function Login() {
  const { login, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = useMemo(() => {
    const from = location.state?.from?.pathname
    if (typeof from === 'string' && from !== '/login') return from
    return '/dashboard'
  }, [location.state])

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const submit = async e => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(extractApiError(err, 'Unable to sign in. Please check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="ds-card w-full max-w-md p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4880ff] text-lg font-bold text-white shadow-[0_10px_24px_rgba(72,128,255,0.35)]">
            DS
          </div>
          <h1 className="text-2xl font-bold text-[#202224]">Welcome Back</h1>
          <p className="mt-2 text-sm text-[#8a92a6]">Sign in to continue to your dashboard</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="ds-input"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="********"
              className="ds-input"
              autoComplete="current-password"
            />
          </div>

          <Alert type="error" message={error} />

          <button
            type="submit"
            className="ds-btn-primary flex w-full items-center justify-center py-2.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" label="Signing in..." /> : 'Login'}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">Sign in with your company account.</p>
      </form>
    </div>
  )
}
