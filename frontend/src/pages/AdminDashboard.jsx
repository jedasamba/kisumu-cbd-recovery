import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, FILE_URL } from '../api'
import { getToken, getUser, logout } from '../auth'

const CATEGORIES = [
  'Phone', 'Wallet', 'ID Card', 'Keys', 'Bag',
  'Electronics', 'Documents', 'Other',
]
const STATUSES = [
  'Reported', 'Match Found', 'Verification Pending',
  'Verified', 'Recovered', 'Closed',
]

function formatId(id) {
  return 'R-' + String(id).padStart(6, '0')
}

function formatDate(mysqlDate) {
  const date = new Date(mysqlDate.replace(' ', 'T'))
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function badgeClass(status) {
  return 'badge ' + status.toLowerCase().replace(' ', '-')
}

function AdminDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsResult, reportsResult] = await Promise.all([
          apiGet('admin_stats.php', getToken()),
          apiGet('admin_reports.php', getToken()),
        ])

        if (statsResult.status === 401 || reportsResult.status === 401) {
          logout()
          navigate('/login')
          return
        }
        if (statsResult.status === 403 || reportsResult.status === 403) {
          navigate('/dashboard')
          return
        }
        if (statsResult.ok && reportsResult.ok) {
          setStats(statsResult.data)
          setReports(reportsResult.data.reports)
        } else {
          setError('Could not load the admin data')
        }
      } catch {
        setError('Could not reach the server. Check that Apache is running.')
      }
      setLoading(false)
    }

    loadData()
  }, [navigate])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  async function handleClose(report) {
    const label = formatId(report.report_id)
    if (!window.confirm(`Close report ${label}? This cannot be undone here.`)) {
      return
    }

    try {
      const result = await apiPost(
        'admin_reports.php',
        { report_id: report.report_id },
        getToken()
      )
      if (result.ok) {
        setReports(
          reports.map((r) =>
            r.report_id === report.report_id ? { ...r, status: 'Closed' } : r
          )
        )
        setSelected(null)
      } else {
        setError(result.data.error || 'Could not close the report')
      }
    } catch {
      setError('Could not reach the server. Check that Apache is running.')
    }
  }

  // Filtering happens in the browser, on the list we already loaded
  const term = search.trim().toLowerCase()
  const visibleReports = reports.filter((r) => {
    if (category && r.category !== category) return false
    if (status && r.status !== status) return false
    if (type && r.report_type !== type) return false
    if (term) {
      const text = [
        formatId(r.report_id), r.category, r.brand,
        r.colour, r.description, r.reporter_name,
      ].join(' ').toLowerCase()
      if (!text.includes(term)) return false
    }
    return true
  })

  return (
    <div>
      <header className="navbar">
        <span className="brand">Administrator Dashboard</span>
        <div className="nav-right">
          <span>{user.full_name}</span>
          <button className="link-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content wide-content">
        {error && <p className="message error">{error}</p>}
        {loading && <p>Loading dashboard...</p>}

        {stats && (
          <div className="stats">
            <div className="stat-card">
              <span className="stat-label">Total Reports</span>
              <span className="stat-value">{stats.total_reports}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Matches</span>
              <span className="stat-value">{stats.total_matches}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Items Recovered</span>
              <span className="stat-value">{stats.items_recovered}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Recovery Rate %</span>
              <span className="stat-value">{stats.recovery_rate}%</span>
            </div>
          </div>
        )}

        {!loading && !error && (
          <section className="panel">
            <h2>All Reports</h2>

            <div className="filters">
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Category (All)</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Status (All)</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Type (All)</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Reporter</th>
                    <th>Date Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReports.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty">No reports match.</td>
                    </tr>
                  )}
                  {visibleReports.map((r) => (
                    <tr key={r.report_id}>
                      <td>{formatId(r.report_id)}</td>
                      <td>{r.report_type === 'lost' ? 'Lost' : 'Found'}</td>
                      <td>{r.category}</td>
                      <td><span className={badgeClass(r.status)}>{r.status}</span></td>
                      <td>{r.reporter_name}</td>
                      <td>{formatDate(r.created_at)}</td>
                      <td className="actions">
                        <button className="small-btn" onClick={() => setSelected(r)}>
                          View
                        </button>
                        <button
                          className="small-btn danger"
                          disabled={r.status === 'Closed'}
                          onClick={() => handleClose(r)}
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Report {formatId(selected.report_id)}</h2>

            {selected.photo_url && (
              <img
                className="modal-photo"
                src={`${FILE_URL}/${selected.photo_url}`}
                alt={selected.category}
              />
            )}

            <dl>
              <dt>Type</dt>
              <dd>{selected.report_type === 'lost' ? 'Lost' : 'Found'}</dd>
              <dt>Category</dt>
              <dd>{selected.category}</dd>
              <dt>Brand</dt>
              <dd>{selected.brand || 'Not given'}</dd>
              <dt>Colour</dt>
              <dd>{selected.colour || 'Not given'}</dd>
              <dt>Description</dt>
              <dd>{selected.description || 'None'}</dd>
              <dt>Location</dt>
              <dd>{selected.latitude}, {selected.longitude}</dd>
              <dt>Reporter</dt>
              <dd>{selected.reporter_name}</dd>
              <dt>Submitted</dt>
              <dd>{formatDate(selected.created_at)}</dd>
              <dt>Status</dt>
              <dd><span className={badgeClass(selected.status)}>{selected.status}</span></dd>
            </dl>

            <div className="modal-actions">
              {selected.status !== 'Closed' && (
                <button className="small-btn danger" onClick={() => handleClose(selected)}>
                  Close report
                </button>
              )}
              <button className="small-btn" onClick={() => setSelected(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard