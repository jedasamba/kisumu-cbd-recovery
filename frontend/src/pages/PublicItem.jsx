import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet, FILE_URL } from '../api'

function PublicItem() {
  const { reportId } = useParams()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadItem() {
      const res = await apiGet('public_item.php?id=' + reportId)
      if (!res.ok) {
        setError(res.data.error || 'Item not found.')
      } else {
        setItem(res.data.item)
      }
      setLoading(false)
    }
    loadItem()
  }, [])

  return (
    <div>
      <div className="navbar">
        <span className="brand">Kisumu CBD Recovery</span>
      </div>
      <div className="content">
        <div className="panel">
          <h2>Found Item</h2>
          {loading && <p>Loading...</p>}
          {error && <div className="message error">{error}</div>}
          {item && (
            <div className="report-card">
              {item.photo_url ? (
                <img className="thumb" src={FILE_URL + '/' + item.photo_url} alt="Found item" />
              ) : (
                <div className="thumb placeholder"></div>
              )}
              <div className="report-info">
                <strong>
                  {item.category}
                  {item.brand ? ' - ' + item.brand : ''}
                </strong>
                <p>
                  {item.colour}
                  {item.description ? '. ' + item.description : ''}
                </p>
                <span className={'badge ' + item.status.toLowerCase().replace(' ', '-')}>
                  {item.status}
                </span>
              </div>
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: '#5f6368' }}>
            Is this your item? Log in and report it as lost. The system will match it and ask
            you to prove ownership.
          </p>
          <Link to="/login">Log in</Link> | <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  )
}

export default PublicItem