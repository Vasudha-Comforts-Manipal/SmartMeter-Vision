import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import TenantDashboard from '../pages/TenantDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import AdminFlatsPage from '../pages/AdminFlatsPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import SuperUserLoginPage from '../pages/SuperUserLoginPage'
import SuperUserDashboard from '../pages/SuperUserDashboard'
import ProtectedRoute from '../components/ProtectedRoute'
import SuperUserProtectedRoute from '../components/SuperUserProtectedRoute'

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/superuser/login" element={<SuperUserLoginPage />} />
        <Route
          path="/superuser"
          element={
            <SuperUserProtectedRoute>
              <SuperUserDashboard />
            </SuperUserProtectedRoute>
          }
        />
        <Route
          path="/tenant"
          element={
            <ProtectedRoute requiredRole="tenant">
              <TenantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/flats"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminFlatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router

