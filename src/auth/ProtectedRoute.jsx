import { Navigate, useLocation } from 'react-router-dom'
import useAuth from './useAuth'
import Spinner from '../components/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <Spinner size="lg" label="Checking session..." />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}
