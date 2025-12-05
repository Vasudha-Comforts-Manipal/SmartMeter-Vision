import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthState } from '../services/auth'
import type { UserRole } from '../types/models'

interface Props {
  children: ReactNode
  requiredRole?: UserRole
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, loading } = useAuthState()

  if (loading) {
    return (
      <div className="app-shell">
        <div className="content-container">
          <div className="card">Checking access…</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

