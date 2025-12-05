import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuthState } from '../services/auth'
import { createFlat } from '../services/flats'

const AdminFlatsPage = () => {
  const { user } = useAuthState()
  const navigate = useNavigate()

  const [flatId, setFlatId] = useState('')
  const [initialReading, setInitialReading] = useState('')
  const [tariffPerUnit, setTariffPerUnit] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [userUid, setUserUid] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!user) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!flatId.trim()) {
      setError('Flat ID is required.')
      return
    }
    if (!tariffPerUnit.trim()) {
      setError('Tariff per unit is required.')
      return
    }
    if (!userUid.trim()) {
      setError('User UID is required.')
      return
    }

    const parsedTariff = Number(tariffPerUnit)
    const parsedInitial =
      initialReading.trim() === '' ? null : Number(initialReading)

    if (Number.isNaN(parsedTariff)) {
      setError('Please enter a valid number for Tariff per unit.')
      return
    }
    if (parsedInitial !== null && Number.isNaN(parsedInitial)) {
      setError('Please enter a valid number for Initial reading.')
      return
    }

    try {
      setSubmitting(true)
      await createFlat({
        flatId: flatId.trim(),
        tenantName: tenantName.trim() || undefined,
        tariffPerUnit: parsedTariff,
        userUid: userUid.trim(),
        initialReading: parsedInitial,
      })

      setSuccess('Flat created successfully.')
      // Clear form but keep tariff as it is usually the same.
      setFlatId('')
      setInitialReading('')
      setTenantName('')
      setUserUid('')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error creating flat:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to create flat. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      email={user.email}
      role="admin"
      subtitle="Create and manage flat entries in Firestore."
    >
      <div className="section">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Create new flat</h2>
              <p className="card-subtitle">
                Add a document to the <code>flats</code> collection with the
                required fields.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/admin')}
            >
              Back to admin dashboard
            </button>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 220px' }}>
                <label className="label" htmlFor="flat-id">
                  Flat ID
                </label>
                <input
                  id="flat-id"
                  className="input"
                  type="text"
                  placeholder='e.g. "A-101"'
                  value={flatId}
                  onChange={(e) => setFlatId(e.target.value)}
                  required
                />
              </div>

              <div style={{ flex: '1 1 220px' }}>
                <label className="label" htmlFor="initial-reading">
                  Initial reading
                </label>
                <input
                  id="initial-reading"
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 21091.10"
                  value={initialReading}
                  onChange={(e) => setInitialReading(e.target.value)}
                />
              </div>

              <div style={{ flex: '1 1 220px' }}>
                <label className="label" htmlFor="tariff">
                  Tariff per unit
                </label>
                <input
                  id="tariff"
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 7.5"
                  value={tariffPerUnit}
                  onChange={(e) => setTariffPerUnit(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="tenant-name">
                Tenant name
              </label>
              <input
                id="tenant-name"
                className="input"
                type="text"
                placeholder='e.g. "Chanikya Gajjarapu"'
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="user-uid">
                User UID
              </label>
              <input
                id="user-uid"
                className="input"
                type="text"
                placeholder='Paste the user UID from Firebase Authentication'
                value={userUid}
                onChange={(e) => setUserUid(e.target.value)}
                required
              />
              <p className="muted small">
                Hint: open Firebase Authentication, copy the tenant&apos;s{' '}
                <code>uid</code>, and paste it here.
              </p>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating…' : 'Create flat'}
            </button>

            {error ? <div className="status rejected">{error}</div> : null}
            {success ? <div className="status approved">{success}</div> : null}
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default AdminFlatsPage

