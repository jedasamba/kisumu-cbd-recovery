import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../api'
import { getToken, getUser, logout } from '../auth'

function Notifications() {
  const navigate = useNavigate()
  const user = getUser()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadNotifications() {
    const res = await apiGet('notifications.php', getToken())
    if (res.status === 401) {
      logout()
      navigate('/login')
      return
    }
    if (!res.ok) {
      setError('Could not load notifications.')
    } else {
      setItems(res.data.notifications)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  function destination(n) {
    if (n.type === 'verified' || n.type === 'message') {
      return n.match_id ? '/messages/' + n.match_id : '/dashboard'
    }
    if (n.type === 'flagged_claim') {
      return '/admin'
    }
    return '/dashboard'
  }

  async function openNotification(n) {
    if (!n.is_read) {
      await apiPost('notifications.php', { notification_id: n.notification_id }, getToken())
    }
    navigate(destination(n))
  }

  async function markAllRead() {
    await apiPost('notifications.php', {}, getToken())
    loadNotifications()
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const unreadCount = items.filter((n) => !n.is_read).length

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
          <h2>Notifications</h2>
          <button className="primary small" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div className="panel">
          {loading && <p>Loading...</p>}
          {error && <div className="message error">{error}</div>}

          {!loading && !error && items.length === 0 && (
            <p className="empty">You have no notifications yet.</p>
          )}

          {unreadCount > 0 && (
            <button className="small-btn" onClick={markAllRead}>Mark all as read</button>
          )}

          {items.map((n) => (
            <div
              key={n.notification_id}
              onClick={() => openNotification(n)}
              style={{
                cursor: 'pointer',
                padding: '10px 12px',
                marginTop: '8px',
                borderRadius: '8px',
                background: n.is_read ? '#f8f9fa' : '#e8f0fe',
                borderLeft: n.is_read ? '4px solid #dadce0' : '4px solid #1a73e8',
                fontWeight: n.is_read ? 'normal' : 'bold',
              }}
            >
              <div>{n.message}</div>
              <div style={{ fontSize: '0.75rem', color: '#5f6368', fontWeight: 'normal' }}>
                {new Date(n.created_at.replace(' ', 'T')).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Notifications