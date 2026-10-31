import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api'

function PublicDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiGet('public_stats.php')
        if (res.ok) {
          setData(res.data)
        } else {
          setError('Could not load the figures.')
        }
      } catch {
        setError('Could not reach the server. Check that Apache is running.')
      }
      setLoading(false)
    }
    loadStats()
  }, [])

  const biggest = data && data.lost_by_category.length > 0
    ? data.lost_by_category[0].total
    : 1

  return (
    <div>
      <header className="navbar">
        <span className="brand">Kisumu CBD Recovery</span>
        <div className="nav-right">
          <Link to="/login">Log in</Link>
          <Link to="/register">Register</Link>
        </div>
      </header>

      <main className="content wide-content">
        <h2>Recovery Dashboard</h2>
        <p style={{ color: '#5f6368' }}>
          How lost and found items are being handled in Kisumu CBD. These figures are
          totals only and contain no personal information.
        </p>

        {loading && <p>Loading...</p>}
        {error && <p className="message error">{error}</p>}

        {data && (
          <>
            <div className="stats">
              <div className="stat-card">
                <span className="stat-label">Total Reports</span>
                <span className="stat-value">{data.total_reports}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Lost Items Reported</span>
                <span className="stat-value">{data.lost_reports}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Found Items Reported</span>
                <span className="stat-value">{data.found_reports}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Matches Made</span>
                <span className="stat-value">{data.total_matches}</span>
              </div>
            </div>

            <div className="stats">
              <div className="stat-card">
                <span className="stat-label">Owners Verified</span>
                <span className="stat-value">{data.ownership_verified}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Items Recovered</span>
                <span className="stat-value">{data.items_recovered}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Recovery Rate</span>
                <span className="stat-value">{data.recovery_rate}%</span>
              </div>
            </div>

            <section className="panel">
              <h2>Most Commonly Lost Items</h2>
              {data.lost_by_category.length === 0 && (
                <p className="empty">No lost item reports yet.</p>
              )}
              {data.lost_by_category.map((c) => (
                <div key={c.category} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>{c.category}</span>
                    <span>{c.total}</span>
                  </div>
                  <div style={{ background: '#e8eaed', borderRadius: '6px', height: '10px' }}>
                    <div
                      style={{
                        width: (c.total / biggest) * 100 + '%',
                        background: '#1a73e8',
                        height: '10px',
                        borderRadius: '6px',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default PublicDashboard