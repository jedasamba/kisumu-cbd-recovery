import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../api'
import { getToken, getUser, logout } from '../auth'
import ReportCard from '../components/ReportCard'

function Dashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadReports() {
      try {
        const result = await apiGet('reports.php', getToken())

        // An expired or invalid token sends the user back to log in
        if (result.status === 401) {
          logout()
          navigate('/login')
          return
        }
        if (result.ok) {
          setReports(result.data.reports)
        } else {
          setError(result.data.error || 'Could not load your reports')
        }
      } catch {
        setError('Could not reach the server. Check that Apache is running.')
      }
      setLoading(false)
    }

    loadReports()
  }, [navigate])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const lostReports = reports.filter((r) => r.report_type === 'lost')
  const foundReports = reports.filter((r) => r.report_type === 'found')

  return (
    <div>
      <header className="navbar">
        <span className="brand">Kisumu CBD Recovery</span>
        <div className="nav-right">
          <span>{user.full_name}</span>
          <button className="link-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <div className="content-header">
          <h1>My Reports</h1>
          <button
            className="primary small"
            onClick={() => navigate('/reports/new')}
          >
            Submit New Report
          </button>
        </div>

        {error && <p className="message error">{error}</p>}
        {loading && <p>Loading your reports...</p>}

        {!loading && !error && (
          <div className="columns">
            <section className="column">
              <h2>My Lost Item Reports</h2>
              {lostReports.length === 0 && (
                <p className="empty">No lost item reports yet.</p>
              )}
              {lostReports.map((report) => (
                <ReportCard key={report.report_id} report={report} />
              ))}
            </section>

            <section className="column">
              <h2>My Found Item Reports</h2>
              {foundReports.length === 0 && (
                <p className="empty">No found item reports yet.</p>
              )}
              {foundReports.map((report) => (
                <ReportCard key={report.report_id} report={report} />
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard