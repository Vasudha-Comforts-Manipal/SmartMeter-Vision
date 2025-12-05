import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuthState } from '../services/auth'
import {
  approveReading,
  getApprovedReadings,
  getPendingReadings,
  getRejectedReadings,
  rejectReading,
  reopenReading,
  subscribeToPendingReadings,
  subscribeToApprovedReadings,
  subscribeToRejectedReadings,
} from '../services/readings'
import type { Reading, Flat } from '../types/models'
import { getGlobalTariff, updateGlobalTariff, getMinimumPrice, updateMinimumPrice } from '../services/settings'
import { getAllFlats, updateFlat } from '../services/flats'
import ImageViewerModal from '../components/ImageViewerModal'

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  return value.toFixed(2)
}

const AdminDashboard = () => {
  const { user } = useAuthState()
  const [pending, setPending] = useState<Reading[]>([])
  const [approvedHistory, setApprovedHistory] = useState<Reading[]>([])
  const [rejectedHistory, setRejectedHistory] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [corrections, setCorrections] = useState<Record<string, string>>({})
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [flatFilter, setFlatFilter] = useState<string>('')
  const [flatOptions, setFlatOptions] = useState<string[]>([])
  const [globalTariff, setGlobalTariff] = useState<number>(0)
  const [minimumPrice, setMinimumPrice] = useState<number>(250)
  const [savingGlobalTariff, setSavingGlobalTariff] = useState(false)
  const [savingMinimumPrice, setSavingMinimumPrice] = useState(false)
  const [historyTab, setHistoryTab] = useState<'approved' | 'rejected'>('approved')
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [flats, setFlats] = useState<Flat[]>([])
  const [initialReadings, setInitialReadings] = useState<Record<string, string>>({})
  const [savingInitialReading, setSavingInitialReading] = useState<string | null>(null)

  // Map each flat to its latest approved reading's image URL.
  // This is used to show "previous reading" images alongside the
  // current pending photo for easier cross-checking by admins.
  const latestApprovedImageByFlatId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of approvedHistory) {
      if (!r.imageUrl) continue
      if (map[r.flatId]) continue // keep the first (already latest due to sorting)
      map[r.flatId] = r.imageUrl
    }
    return map
  }, [approvedHistory])

  // For each approved reading, track the image URL of the *previous*
  // approved reading for that same flat. This powers the "Previous photo"
  // button in the admin history table.
  const previousApprovedImageByReadingId = useMemo(() => {
    const map: Record<string, string | null> = {}
    const lastImageByFlat: Record<string, string | null> = {}

    // Work in chronological order so "lastImageByFlat" always refers to
    // the previous approved reading for that flat.
    const sortedAsc = [...approvedHistory].sort(
      (a, b) => (a.approvedAt || a.createdAt || 0) - (b.approvedAt || b.createdAt || 0),
    )

    for (const r of sortedAsc) {
      map[r.id] = lastImageByFlat[r.flatId] ?? null
      if (r.imageUrl) {
        lastImageByFlat[r.flatId] = r.imageUrl
      }
    }

    return map
  }, [approvedHistory])

  const loadData = async (selectedFlat?: string) => {
    setLoading(true)
    try {
      const [pendingItems, approvedItems, rejectedItems, currentTariff, currentMinimumPrice, allFlats] =
        await Promise.all([
          getPendingReadings(),
          getApprovedReadings(selectedFlat || undefined),
          getRejectedReadings(selectedFlat || undefined),
          getGlobalTariff().catch(() => 0),
          getMinimumPrice().catch(() => 250),
          getAllFlats().catch((error) => {
            console.error('Error loading flats:', error)
            return []
          }),
        ])
      setPending(pendingItems)
      setApprovedHistory(approvedItems)
      setRejectedHistory(rejectedItems)
      setGlobalTariff(currentTariff)
      setMinimumPrice(currentMinimumPrice)

      // Determine which flats still need an initial reading configured.
      // Show the "Initial Readings" section only for:
      // - flats that have no approved readings yet, AND
      // - flats whose initialReading is either null/undefined or 0.
      const flatsWithApprovedReadings = new Set<string>()
      approvedItems.forEach((r) => flatsWithApprovedReadings.add(r.flatId))
      const flatsNeedingInitialReading = allFlats.filter((flat) => {
        const hasApproved = flatsWithApprovedReadings.has(flat.flatId)
        const initial = flat.initialReading
        const hasNoExplicitInitial =
          initial === null || initial === undefined || initial === 0
        return !hasApproved && hasNoExplicitInitial
      })
      setFlats(flatsNeedingInitialReading)

      // Initialize initial readings state from flats that still need configuration
      const initialReadingsState: Record<string, string> = {}
      flatsNeedingInitialReading.forEach((flat) => {
        if (flat.initialReading !== null && flat.initialReading !== undefined) {
          initialReadingsState[flat.id] = formatNumber(flat.initialReading)
        }
      })
      setInitialReadings(initialReadingsState)
      const ids = new Set<string>()
      approvedItems.forEach((r) => ids.add(r.flatId))
      rejectedItems.forEach((r) => ids.add(r.flatId))
      setFlatOptions(Array.from(ids))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(flatFilter)
  }, [flatFilter])

  // Set up real-time listeners for dynamic updates
  useEffect(() => {
    // Subscribe to pending readings
    const unsubscribePending = subscribeToPendingReadings((readings) => {
      setPending(readings)
    })

    // Subscribe to approved readings
    const unsubscribeApproved = subscribeToApprovedReadings((readings) => {
      setApprovedHistory(readings)
      // Update flat options when approved readings change
      const ids = new Set<string>()
      readings.forEach((r) => ids.add(r.flatId))
      setFlatOptions((prev) => {
        const combined = new Set([...prev, ...ids])
        return Array.from(combined)
      })
    }, flatFilter || undefined)

    // Subscribe to rejected readings
    const unsubscribeRejected = subscribeToRejectedReadings((readings) => {
      setRejectedHistory(readings)
      // Update flat options when rejected readings change
      const ids = new Set<string>()
      readings.forEach((r) => ids.add(r.flatId))
      setFlatOptions((prev) => {
        const combined = new Set([...prev, ...ids])
        return Array.from(combined)
      })
    }, flatFilter || undefined)

    // Cleanup subscriptions on unmount or when flatFilter changes
    return () => {
      unsubscribePending()
      unsubscribeApproved()
      unsubscribeRejected()
    }
  }, [flatFilter])

  const handleApprove = async (reading: Reading) => {
    const value =
      corrections[reading.id] && corrections[reading.id].trim() !== ''
        ? Number(corrections[reading.id])
        : reading.ocrReading
    if (value === null || Number.isNaN(value)) {
      alert('Please enter a valid corrected reading.')
      return
    }
    setSubmitting(reading.id)
    try {
      await approveReading(reading.id, value)
      await loadData(flatFilter)
      setCorrections((prev) => {
        const next = { ...prev }
        delete next[reading.id]
        return next
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setSubmitting(null)
    }
  }

  const handleReject = async (reading: Reading) => {
    const reason = (rejectionReasons[reading.id] ?? '').trim()
    if (!reason) {
      alert('Please enter a rejection reason before rejecting.')
      return
    }
    setSubmitting(reading.id)
    try {
      await rejectReading(reading.id, reason)
      await loadData(flatFilter)
      setRejectionReasons((prev) => {
        const next = { ...prev }
        delete next[reading.id]
        return next
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setSubmitting(null)
    }
  }

  const handleReopen = async (reading: Reading) => {
    const reason = window.prompt('Enter a reason to re-open this reading:') ?? ''
    const trimmed = reason.trim()
    if (!trimmed) {
      alert('Please enter a reason to re-open.')
      return
    }
    setSubmitting(reading.id)
    try {
      await reopenReading(reading.id, trimmed)
      await loadData(flatFilter)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to re-open reading')
    } finally {
      setSubmitting(null)
    }
  }

  const handleSaveGlobalTariff = async () => {
    setSavingGlobalTariff(true)
    try {
      await updateGlobalTariff(globalTariff)
      await loadData(flatFilter)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update global tariff')
    } finally {
      setSavingGlobalTariff(false)
    }
  }

  const handleSaveMinimumPrice = async () => {
    setSavingMinimumPrice(true)
    try {
      await updateMinimumPrice(minimumPrice)
      await loadData(flatFilter)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update minimum price')
    } finally {
      setSavingMinimumPrice(false)
    }
  }

  const handleSaveInitialReading = async (flatId: string) => {
    setSavingInitialReading(flatId)
    try {
      const value = initialReadings[flatId]
      const readingValue = value && value.trim() !== '' ? Number(value) : null
      if (readingValue !== null && Number.isNaN(readingValue)) {
        alert('Please enter a valid initial reading.')
        setSavingInitialReading(null)
        return
      }
      await updateFlat(flatId, { initialReading: readingValue })
      // Reload data to refresh the list
      await loadData(flatFilter)
      alert('Initial reading saved successfully!')
    } catch (error) {
      console.error('Error saving initial reading:', error)
      alert(error instanceof Error ? error.message : 'Failed to update initial reading')
    } finally {
      setSavingInitialReading(null)
    }
  }

  if (!user) return null

  return (
    <Layout email={user.email} role="admin" subtitle="Review and approve meter readings.">
      <div className="section">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Flats</h2>
              <p className="card-subtitle">
                Create and manage flat entries for tenants.
              </p>
            </div>
            <Link className="btn btn-secondary" to="/admin/flats">
              Add / edit flats
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Tariff</h2>
              <p className="card-subtitle">
                Configure the global cost per unit/KG and minimum price. This applies to all flats for future approvals.
              </p>
            </div>
          </div>
          <div className="stack">
            <label className="label" htmlFor="global-tariff">
              Global tariff (cost per unit/KG)
            </label>
            <div className="row">
              <input
                id="global-tariff"
                className="input"
                type="number"
                step="0.01"
                value={globalTariff}
                onChange={(e) => setGlobalTariff(Number(e.target.value) || 0)}
                style={{ width: 160 }}
              />
              <button
                className="btn btn-secondary"
                type="button"
                disabled={savingGlobalTariff}
                onClick={handleSaveGlobalTariff}
              >
                {savingGlobalTariff ? 'Saving…' : 'Save tariff'}
              </button>
            </div>
            <label className="label" htmlFor="minimum-price">
              Minimum price
            </label>
            <div className="row">
              <input
                id="minimum-price"
                className="input"
                type="number"
                step="0.01"
                value={minimumPrice}
                onChange={(e) => setMinimumPrice(Number(e.target.value) || 0)}
                style={{ width: 160 }}
              />
              <button
                className="btn btn-secondary"
                type="button"
                disabled={savingMinimumPrice}
                onClick={handleSaveMinimumPrice}
              >
                {savingMinimumPrice ? 'Saving…' : 'Save minimum price'}
              </button>
            </div>
          </div>
        </div>

        {flats.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Initial Readings</h2>
                <p className="card-subtitle">
                  Set the starting meter reading for flats that haven't had any approved readings yet, or that are still using a 0 / unset starting value. This will be used as the previous reading when calculating the first approved reading.
                </p>
              </div>
            </div>
            <div className="stack">
              <table className="table">
                <thead>
                  <tr>
                    <th>Flat ID</th>
                    <th>Tenant Name</th>
                    <th>Initial Reading</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flats.map((flat) => (
                    <tr key={flat.id}>
                      <td>
                        <strong>{flat.flatId || flat.id}</strong>
                      </td>
                      <td>{flat.tenantName ?? '—'}</td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          placeholder="Enter initial reading"
                          value={initialReadings[flat.id] ?? ''}
                          onChange={(e) =>
                            setInitialReadings((prev) => ({ ...prev, [flat.id]: e.target.value }))
                          }
                          style={{ width: 160 }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          disabled={savingInitialReading === flat.id}
                          onClick={() => handleSaveInitialReading(flat.id)}
                        >
                          {savingInitialReading === flat.id ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Pending readings</h2>
              <p className="card-subtitle">OCR + image proof. Approve or reject.</p>
            </div>
            <span className="pill">{pending.length} pending</span>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="muted">No pending readings.</p>
          ) : (
            <div className="stack">
              {pending.map((reading) => (
                <div key={reading.id} className="card" style={{ boxShadow: 'none', padding: 16 }}>
                  <div className="card-header">
                    <div>
                      <p className="subtitle">Flat {reading.flatId}</p>
                      <h3 className="card-title">
                        OCR:{' '}
                        {reading.ocrReading !== null && reading.ocrReading !== undefined
                          ? formatNumber(reading.ocrReading)
                          : 'N/A'}
                      </h3>
                      {reading.ocrConfidence ? (
                        <span className="pill">Confidence {reading.ocrConfidence.toFixed(0)}%</span>
                      ) : null}
                    </div>
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-tertiary"
                        type="button"
                        onClick={() => setViewingImage(reading.imageUrl)}
                      >
                        Current photo
                      </button>
                      {latestApprovedImageByFlatId[reading.flatId] ? (
                        <button
                          className="btn btn-tertiary"
                          type="button"
                          onClick={() =>
                            setViewingImage(latestApprovedImageByFlatId[reading.flatId]!)
                          }
                        >
                          Previous photo
                        </button>
                      ) : (
                        <span className="muted small">No previous photo</span>
                      )}
                    </div>
                  </div>
                  <div className="stack">
                    <label className="label" htmlFor={`corrected-${reading.id}`}>
                      Corrected reading
                    </label>
                    <input
                      id={`corrected-${reading.id}`}
                      className="input"
                      type="number"
                      placeholder="Enter corrected reading"
                      value={corrections[reading.id] ?? ''}
                      onChange={(e) =>
                        setCorrections((prev) => ({ ...prev, [reading.id]: e.target.value }))
                      }
                    />
                    <label className="label" htmlFor={`reject-reason-${reading.id}`}>
                      Rejection reason
                    </label>
                    <input
                      id={`reject-reason-${reading.id}`}
                      className="input"
                      type="text"
                      placeholder="Explain why this reading is rejected"
                      value={rejectionReasons[reading.id] ?? ''}
                      onChange={(e) =>
                        setRejectionReasons((prev) => ({ ...prev, [reading.id]: e.target.value }))
                      }
                    />
                    <div className="row">
                      <button
                        className="btn btn-primary"
                        disabled={submitting === reading.id}
                        onClick={() => handleApprove(reading)}
                      >
                        {submitting === reading.id ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-ghost"
                        disabled={submitting === reading.id}
                        onClick={() => handleReject(reading)}
                      >
                        {submitting === reading.id ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">History</h2>
              <p className="card-subtitle">Track approved and rejected readings.</p>
            </div>
            <div className="row">
              <div className="row" role="tablist" style={{ gap: 8 }}>
                <button
                  className={`btn btn-ghost ${historyTab === 'approved' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setHistoryTab('approved')}
                >
                  Approved
                </button>
                <button
                  className={`btn btn-ghost ${historyTab === 'rejected' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setHistoryTab('rejected')}
                >
                  Rejected
                </button>
              </div>
              <select
                className="select"
                value={flatFilter}
                onChange={(e) => setFlatFilter(e.target.value)}
              >
                <option value="">All flats</option>
                {flatOptions.map((flat) => (
                  <option key={flat} value={flat}>
                    {flat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : historyTab === 'approved' ? (
            approvedHistory.length === 0 ? (
              <p className="muted">No approved readings yet.</p>
            ) : (
              <div className="stack">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Flat</th>
                      <th>Period</th>
                      <th>Previous</th>
                      <th>Reading</th>
                      <th>Units</th>
                      <th>Amount</th>
                      <th>Tariff used</th>
                      <th>Approved</th>
                      <th>Image</th>
                      <th>Re-open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.flatId}</td>
                        <td>{item.yearMonth ?? '—'}</td>
                        <td>{formatNumber(item.previousReading)}</td>
                        <td>
                          {item.correctedReading !== null && item.correctedReading !== undefined
                            ? formatNumber(item.correctedReading)
                            : formatNumber(item.ocrReading)}
                        </td>
                        <td>{formatNumber(item.unitsUsed)}</td>
                        <td>{formatNumber(item.amount)}</td>
                        <td>{formatNumber(item.tariffAtApproval)}</td>
                        <td>
                          {item.approvedAt ? new Date(item.approvedAt).toLocaleString() : '—'}
                        </td>
                        <td>
                          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="pill"
                              type="button"
                              disabled={!item.imageUrl}
                              onClick={() => item.imageUrl && setViewingImage(item.imageUrl)}
                            >
                              Current photo
                            </button>
                            {previousApprovedImageByReadingId[item.id] ? (
                              <button
                                className="pill"
                                type="button"
                                onClick={() =>
                                  setViewingImage(previousApprovedImageByReadingId[item.id]!)
                                }
                              >
                                Previous photo
                              </button>
                            ) : (
                              <span className="muted small">No previous photo</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={submitting === item.id}
                            onClick={() => handleReopen(item)}
                          >
                            {submitting === item.id ? 'Re-opening…' : 'Re-open'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : rejectedHistory.length === 0 ? (
            <p className="muted">No rejected readings.</p>
          ) : (
            <div className="stack">
              <table className="table">
                <thead>
                  <tr>
                    <th>Flat</th>
                    <th>Period</th>
                    <th>Reading</th>
                    <th>Reason</th>
                    <th>Created</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {rejectedHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.flatId}</td>
                      <td>{item.yearMonth ?? '—'}</td>
                      <td>
                        {item.correctedReading !== null && item.correctedReading !== undefined
                          ? formatNumber(item.correctedReading)
                          : formatNumber(item.ocrReading)}
                      </td>
                      <td>{item.rejectionReason ?? '—'}</td>
                      <td>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                      </td>
                      <td>
                        <a className="pill" href={item.imageUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {viewingImage && (
        <ImageViewerModal imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
      )}
    </Layout>
  )
}

export default AdminDashboard

