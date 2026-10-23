import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost, FILE_URL } from '../api'
import { getToken, getUser, logout } from '../auth'

const noteStyle = { fontSize: '0.85rem', color: '#5f6368', margin: '6px 0 0' }

function ClaimItem() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const user = getUser()

  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [attemptsLeft, setAttemptsLeft] = useState(0)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadMatch() {
      const res = await apiGet('matches.php', getToken())
      if (res.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (res.ok) {
        const found = res.data.matches.find((m) => String(m.match_id) === matchId)
        if (found) {
          setMatch(found)
          setAttemptsLeft(found.attempts_left)
          if (found.status !== 'Pending' || found.my_role !== 'owner') {
            setDone(true)
          }
        }
      }
      setLoading(false)
    }
    loadMatch()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    if (answer.trim() === '') {
      setMessageType('error')
      setMessage('Please type your answer first.')
      return
    }
    setSubmitting(true)
    const res = await apiPost(
      'verify.php',
      { match_id: Number(matchId), answer: answer },
      getToken()
    )
    setSubmitting(false)

    if (res.status === 401) {
      logout()
      navigate('/login')
      return
    }

    if (res.ok && res.data.verified) {
      setMessageType('success')
      setMessage(res.data.message)
      setDone(true)
      return
    }

    setMessageType('error')
    setMessage(res.data.error || 'Something went wrong. Please try again.')
    if (typeof res.data.attempts_left === 'number') {
      setAttemptsLeft(res.data.attempts_left)
    }
    if (res.data.flagged || res.status === 409 || res.status === 403) {
      setDone(true)
    }
    setAnswer('')
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

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
          <h2>Claim Item</h2>
          <button className="primary small" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && !match && (
          <div className="message error">This match was not found.</div>
        )}

        {match && (
          <div className="panel">
            <div className="report-card">
              {match.other_report.photo_url ? (
                <img
                  className="thumb"
                  src={FILE_URL + '/' + match.other_report.photo_url}
                  alt="Found item"
                />
              ) : (
                <div className="thumb placeholder"></div>
              )}
              <div className="report-info">
                <strong>
                  {match.other_report.category}
                  {match.other_report.brand ? ' - ' + match.other_report.brand : ''}
                </strong>
                <p style={noteStyle}>
                  {match.other_report.colour}
                  {match.other_report.description ? '. ' + match.other_report.description : ''}
                </p>
                <p style={noteStyle}>Match score: {Math.round(match.similarity_score)}%</p>
              </div>
            </div>

            <h3>Prove this item is yours</h3>

            {message && <div className={'message ' + messageType}>{message}</div>}

            {!done && (
              <form onSubmit={handleSubmit}>
                <label>Describe a private detail only the owner would know</label>
                <textarea
                  rows="3"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="For example, a mark, sticker, engraving or something inside the item"
                />
                <p style={noteStyle}>Attempts left: {attemptsLeft}</p>
                <button className="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Checking...' : 'Submit Answer'}
                </button>
              </form>
            )}

            {done && !message && (
              <p style={noteStyle}>
                {match.status === 'Verified'
                  ? 'This claim is already verified.'
                  : match.status === 'Flagged'
                  ? 'This claim is locked and waiting for an administrator.'
                  : 'You cannot claim this item.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClaimItem