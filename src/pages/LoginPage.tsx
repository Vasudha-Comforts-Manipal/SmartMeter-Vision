import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { getUserRole } from '../components/ProtectedRoute'

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      const role = getUserRole(email)
      navigate(role === 'admin' ? '/admin' : '/tenant', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="content-container">
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="card-header">
            <div>
              <h1 className="card-title">SmartMeter Vision</h1>
              <p className="card-subtitle">Login to continue</p>
            </div>
          </div>
          <form className="stack" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="flat101@building.com or admin@building.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
            {error ? <div className="status rejected">{error}</div> : null}
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

