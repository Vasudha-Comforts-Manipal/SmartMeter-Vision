import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthState } from '../services/auth'
import type { UserRole } from '../types/models'

interface Props {
  children: ReactNode
  requiredRole?: UserRole
}

export function getUserRole(email?: string | null): UserRole {
  if (!email) return 'tenant'
  return email.toLowerCase().startsWith('admin') ? 'admin' : 'tenant'
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

  const role = getUserRole(user.email)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

