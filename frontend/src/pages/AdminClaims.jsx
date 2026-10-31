import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, FILE_URL } from '../api'
import { getToken, getUser, logout } from '../auth'

const noteStyle = { fontSize: '0.85rem', color: '#5f6368', margin: '4px 0 0' }

function AdminClaims() {
  const navigate = useNavigate()
  const user = getUser()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadClaims() {
    try {
      const res = await apiGet('admin_claims.php', getToken())
      if (res.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (res.status === 403) {
        navigate('/dashboard')
        return
      }
      if (!res.ok) {
        setError('Could not load flagged claims.')
      } else {
        setError('')
        setClaims(res.data.claims)
      }
    } catch {
      setError('Could not reach the server. Check that Apache is running.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadClaims()
  }, [])

  async function decide(claim, action) {
    const question =
      action === 'reset'
        ? 'Give ' + claim.owner_name + ' 3 new attempts?'
        : 'Reject the claim by ' + claim.owner_name + '?'
    if (!window.confirm(question)) return

    setMessage('')
    const res = await apiPost(
      'admin_claims.php',
      { match_id: claim.match_id, action: action },
      getToken()
    )
    if (!res.ok) {
      setError(res.data.error || 'Could not save the decision.')
      return
    }
    setError('')
    setMessage(res.data.message)
    loadClaims()
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <header className="navbar">
        <span className="brand">Administrator Dashboard</span>
        <div className="nav-right">
          <span>{user && user.full_name}</span>
          <button className="link-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="content wide-content">
        <div className="content-header">
          <h2>Flagged Claims</h2>
          <button className="primary small" onClick={() => navigate('/admin')}>
            Back to Admin
          </button>
        </div>

        <p style={{ color: '#5f6368' }}>
          These owners gave three wrong answers. Decide whether to let them try again or
          reject the claim.
        </p>

        {loading && <p>Loading...</p>}
        {error && <p className="message error">{error}</p>}
        {message && <p className="message success">{message}</p>}

        {!loading && !error && claims.length === 0 && (
          <section className="panel">
            <p className="empty">No flagged claims waiting for review.</p>
          </section>
        )}

        {claims.map((c) => (
          <section className="panel" key={c.match_id}>
            <h3>Match #{c.match_id} ({Math.round(c.similarity_score)}% match)</h3>

            <div className="columns">
              <div className="column">
                <strong>Claimed by (lost item owner)</strong>
                <p style={noteStyle}>
                  {c.owner_name}
                  {c.owner_phone ? ' - ' + c.owner_phone : ''}
                </p>
                <p style={noteStyle}>
                  Lost: {c.lost_category}
                  {c.lost_brand ? ', ' + c.lost_brand : ''}
                  {c.lost_colour ? ', ' + c.lost_colour : ''}
                </p>
                {c.lost_description && <p style={noteStyle}>{c.lost_description}</p>}
              </div>

              <div className="column">
                <strong>Finder</strong>
                <p style={noteStyle}>
                  {c.finder_name}
                  {c.finder_phone ? ' - ' + c.finder_phone : ''}
                </p>
                <p style={noteStyle}>
                  Found: {c.found_category}
                  {c.found_brand ? ', ' + c.found_brand : ''}
                  {c.found_colour ? ', ' + c.found_colour : ''}
                </p>
                {c.found_description && <p style={noteStyle}>{c.found_description}</p>}
                {c.found_photo && (
                  <img
                    className="thumb"
                    src={FILE_URL + '/' + c.found_photo}
                    alt="Found item"
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button className="primary small" onClick={() => decide(c, 'reset')}>
                Give another chance
              </button>
              <button className="small-btn danger" onClick={() => decide(c, 'reject')}>
                Reject claim
              </button>
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

export default AdminClaims