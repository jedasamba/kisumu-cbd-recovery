import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost } from '../api'
import { getToken, getUser, logout } from '../auth'

const boxStyle = {
  maxHeight: '55vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '8px 0',
}

function bubbleStyle(mine) {
  return {
    alignSelf: mine ? 'flex-end' : 'flex-start',
    background: mine ? '#1a73e8' : '#eef1f5',
    color: mine ? '#ffffff' : '#202124',
    padding: '8px 12px',
    borderRadius: '12px',
    maxWidth: '80%',
    wordBreak: 'break-word',
  }
}

function Messages() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const user = getUser()
  const bottomRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  async function loadMessages() {
    const res = await apiGet('messages.php?match_id=' + matchId, getToken())
    if (res.status === 401) {
      logout()
      navigate('/login')
      return
    }
    if (!res.ok) {
      setError(res.data.error || 'Could not load messages.')
    } else {
      setError('')
      setMessages(res.data.messages)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMessages()
    const timer = setInterval(loadMessages, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  async function handleSend(e) {
    e.preventDefault()
    if (text.trim() === '') return
    setSending(true)
    const res = await apiPost(
      'messages.php',
      { match_id: Number(matchId), message_text: text },
      getToken()
    )
    setSending(false)
    if (res.status === 401) {
      logout()
      navigate('/login')
      return
    }
    if (!res.ok) {
      setError(res.data.error || 'Could not send your message.')
      return
    }
    setText('')
    loadMessages()
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
          <h2>Messages</h2>
          <button className="primary small" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div className="panel">
          {loading && <p>Loading...</p>}
          {error && <div className="message error">{error}</div>}

          {!loading && !error && (
            <>
              <div style={boxStyle}>
                {messages.length === 0 && (
                  <p className="empty">No messages yet. Say hello and arrange how to hand over the item safely.</p>
                )}
                {messages.map((m) => (
                  <div key={m.message_id} style={bubbleStyle(m.mine)}>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {m.mine ? 'You' : m.sender_name}
                    </div>
                    <div>{m.message_text}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'right' }}>
                      {new Date(m.sent_at.replace(' ', 'T')).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}></div>
              </div>

              <form onSubmit={handleSend}>
                <textarea
                  rows="2"
                  maxLength="500"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message"
                />
                <button className="primary" type="submit" disabled={sending}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
              <p style={{ fontSize: '0.8rem', color: '#5f6368' }}>
                Meet in a public place in the CBD when handing over the item.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages
