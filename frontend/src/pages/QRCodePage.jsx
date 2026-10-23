import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { apiGet } from '../api'
import { getToken, getUser, logout } from '../auth'

function QRCodePage() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const user = getUser()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQr() {
      const res = await apiGet('qr.php?report_id=' + reportId, getToken())
      if (res.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (!res.ok) {
        setError(res.data.error || 'Could not load the QR code.')
      } else {
        setUrl(res.data.qr_code_url)
      }
      setLoading(false)
    }
    loadQr()
  }, [])

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
          <h2>Found Item QR Code</h2>
          <button className="primary small" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div className="panel" style={{ textAlign: 'center' }}>
          {loading && <p>Loading...</p>}
          {error && <div className="message error">{error}</div>}
          {url && (
            <>
              <QRCodeSVG value={url} size={220} />
              <p style={{ fontSize: '0.85rem', color: '#5f6368', wordBreak: 'break-all' }}>{url}</p>
              <p style={{ fontSize: '0.85rem', color: '#5f6368' }}>
                Print this code and attach it to the item. Anyone who scans it sees the item
                details and is asked to log in. Your private detail is never shown.
              </p>
              <button className="primary" onClick={() => window.print()}>Print QR Code</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default QRCodePage