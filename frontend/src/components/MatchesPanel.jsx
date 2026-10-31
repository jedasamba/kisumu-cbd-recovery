import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, FILE_URL } from '../api'
import { getToken, logout } from '../auth'

const noteStyle = { fontSize: '0.85rem', color: '#5f6368', margin: '6px 0 0' }

function MatchesPanel() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [recoveredIds, setRecoveredIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  async function loadAll() {
    const res = await apiGet('matches.php', getToken())
    if (res.status === 401) {
      logout()
      navigate('/login')
      return
    }
    if (!res.ok) {
      setError('Could not load matches. Please try again.')
    } else {
      setMatches(res.data.matches)
    }

    const rec = await apiGet('recover.php', getToken())
    if (rec.ok) {
      setRecoveredIds(rec.data.recovered_match_ids)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleRecovered(m) {
    if (!window.confirm('Confirm that you have received your item back? This cannot be undone.')) {
      return
    }
    setActionMessage('')
    const res = await apiPost('recover.php', { match_id: m.match_id }, getToken())
    if (res.status === 401) {
      logout()
      navigate('/login')
      return
    }
    if (!res.ok) {
      setActionMessage(res.data.error || 'Could not save. Please try again.')
      return
    }
    setActionMessage(res.data.message)
    loadAll()
  }

  function renderAction(m) {
    if (m.status === 'Verified') {
      if (recoveredIds.includes(m.match_id)) {
        return (
          <div>
            <span className="badge recovered">Recovered</span>
            <p style={noteStyle}>This item has been returned to its owner.</p>
          </div>
        )
      }
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge verified">Verified</span>
          <button
            className="primary small"
            onClick={() => navigate('/messages/' + m.match_id)}
          >
            Message
          </button>
          {m.my_role === 'owner' && (
            <button className="small-btn" onClick={() => handleRecovered(m)}>
              Confirm item received
            </button>
          )}
        </div>
      )
    }
    if (m.status === 'Flagged') {
      return <p style={noteStyle}>Claim locked. An admin will review it.</p>
    }
    if (m.my_role === 'owner') {
      return (
        <button
          className="primary small"
          onClick={() => navigate('/claim/' + m.match_id)}
        >
          Claim Item ({m.attempts_left} attempts left)
        </button>
      )
    }
    return <p style={noteStyle}>Waiting for the owner to verify.</p>
  }

  return (
    <div className="panel">
      <h2>Possible matches</h2>
      {loading && <p>Loading...</p>}
      {error && <div className="message error">{error}</div>}
      {actionMessage && <div className="message success">{actionMessage}</div>}
      {!loading && !error && matches.length === 0 && (
        <p className="empty">No matches yet. We will notify you when one is found.</p>
      )}
      {matches.map((m) => (
        <div className="report-card" key={m.match_id}>
          {m.other_report.photo_url ? (
            <img
              className="thumb"
              src={FILE_URL + '/' + m.other_report.photo_url}
              alt="Matched item"
            />
          ) : (
            <div className="thumb placeholder"></div>
          )}
          <div className="report-info">
            <strong>
              {m.other_report.category}
              {m.other_report.brand ? ' - ' + m.other_report.brand : ''}
            </strong>
            <p style={noteStyle}>
              {m.other_report.colour}
              {m.other_report.description ? '. ' + m.other_report.description : ''}
            </p>
            <p style={noteStyle}>
              {m.my_role === 'owner'
                ? 'Someone found an item like yours.'
                : 'Your found item may belong to someone.'}{' '}
              Match score: {Math.round(m.similarity_score)}%
            </p>
            {renderAction(m)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default MatchesPanel