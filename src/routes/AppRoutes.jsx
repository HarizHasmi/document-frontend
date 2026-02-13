import { Navigate, Route, Routes } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Documents from '../pages/Documents'
import UploadDocument from '../pages/UploadDocument'
import DocumentDetails from '../pages/DocumentDetails'
import EditDocument from '../pages/EditDocument'
import DashboardLayout from '../layouts/DashboardLayout'
import ProtectedRoute from '../auth/ProtectedRoute'
import useAuth from '../auth/useAuth'

function LandingPageRedirect() {
  const { user, loading } = useAuth()

  if (loading) return null
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="documents/upload" element={<UploadDocument />} />
        <Route path="documents/:id" element={<DocumentDetails />} />
        <Route path="documents/:id/edit" element={<EditDocument />} />
      </Route>

      <Route path="*" element={<LandingPageRedirect />} />
    </Routes>
  )
}
