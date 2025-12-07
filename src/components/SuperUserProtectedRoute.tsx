import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getCurrentSuperUser } from '../services/superUserAuth'

interface Props {
  children: ReactNode
}

const SuperUserProtectedRoute = ({ children }: Props) => {
  const superUser = getCurrentSuperUser()

  if (!superUser) {
    return <Navigate to="/superuser/login" replace />
  }

  return <>{children}</>
}

export default SuperUserProtectedRoute
