import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../api'
import { getToken, getUser, logout } from '../auth'
import ReportCard from '../components/ReportCard'
import MatchesPanel from '../components/MatchesPanel'

function Dashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadReports() {
      const res = await apiGet('reports.php', getToken())
      if (res.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (!res.ok) {
        setError('Could not load your reports.')
      } else {
        setReports(res.data.reports)
      }
      setLoading(false)
    }
    loadReports()
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const lost = reports.filter((r) => r.report_type === 'lost')
  const found = reports.filter((r) => r.report_type === 'found')

  return (
    <div>
      <div className="navbar">
        <span className="brand">Kisumu CBD Recovery</span>
        <div className="nav-right">
          <span>{user && user.full_name}</span>
          <button className="link-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="content">
        <div className="content-header">
          <h2>My Reports</h2>
          <button className="primary small" onClick={() => navigate('/reports/new')}>
            Submit New Report
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <div className="message error">{error}</div>}

        <MatchesPanel />

        {!loading && !error && (
          <div className="columns">
            <div className="column">
              <h3>My Lost Item Reports</h3>
              {lost.length === 0 && <p className="empty">No lost item reports yet.</p>}
              {lost.map((r) => <ReportCard key={r.report_id} report={r} />)}
            </div>
            <div className="column">
              <h3>My Found Item Reports</h3>
              {found.length === 0 && <p className="empty">No found item reports yet.</p>}
              {found.map((r) => (
                <div key={r.report_id}>
                  <ReportCard report={r} />
                  <button
                    className="small-btn"
                    onClick={() => navigate('/qr/' + r.report_id)}
                  >
                    View QR code
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard