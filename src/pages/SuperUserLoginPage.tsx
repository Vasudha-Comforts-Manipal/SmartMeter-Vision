import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginSuperUser } from '../services/superUserAuth'

const SuperUserLoginPage = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await loginSuperUser()
      navigate('/superuser', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="content-container">
        <div className="card" style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
          <div className="card-header">
            <div>
              <h1 className="card-title">Super User Access</h1>
              <p className="card-subtitle">Emergency admin password reset</p>
            </div>
          </div>
          <div className="stack">
            <div className="status warning" style={{ marginBottom: '16px' }}>
              <strong>⚠️ Emergency Access Only</strong>
              <p style={{ marginTop: '8px', marginBottom: 0 }}>
                This is a restricted access point for resetting admin passwords when the admin account is locked out.
                Only authorized super users can access this page.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              type="button" 
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                'Signing in…'
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
            {error ? (
              <div className="status rejected">
                <strong>Error:</strong> {error}
                {error.includes('Firebase Authentication is not configured') && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '13px' }}>
                    <strong>Setup Instructions:</strong>
                    <ol style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '20px' }}>
                      <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                      <li>Select your project</li>
                      <li>Navigate to <strong>Authentication</strong> → <strong>Sign-in method</strong></li>
                      <li>Click on <strong>Google</strong> provider</li>
                      <li>Click <strong>Enable</strong> and save</li>
                      <li>Add your domain (e.g., <code>localhost</code> for development) to authorized domains</li>
                    </ol>
                    <p style={{ marginBottom: 0, fontSize: '12px' }}>
                      See <a href="/superuser-guide" style={{ textDecoration: 'underline' }}>SUPER_USER_GUIDE.md</a> for detailed instructions.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate('/login')}
              >
                Back to regular login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperUserLoginPage
