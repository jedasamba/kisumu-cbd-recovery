import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, FILE_URL } from '../api'
import { getToken, logout } from '../auth'

const noteStyle = { fontSize: '0.85rem', color: '#5f6368', margin: '6px 0 0' }

function MatchesPanel() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMatches() {
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
      setLoading(false)
    }
    loadMatches()
  }, [])

  function renderAction(m) {
    if (m.status === 'Verified') {
      return (
        <div>
          <span className="badge verified">Verified</span>{' '}
          <button
            className="primary small"
            onClick={() => navigate('/messages/' + m.match_id)}
          >
            Message
          </button>
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