import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, FILE_URL } from '../api'
import { getToken, getUser, logout } from '../auth'

const CATEGORIES = [
  'Phone', 'Wallet', 'ID Card', 'Keys', 'Bag',
  'Electronics', 'Documents', 'Other',
]

const noteStyle = { fontSize: '0.85rem', color: '#5f6368', margin: '4px 0 0' }

function formatDate(mysqlDate) {
  const date = new Date(mysqlDate.replace(' ', 'T'))
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SearchItems() {
  const navigate = useNavigate()
  const user = getUser()

  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [colour, setColour] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function runSearch() {
    setLoading(true)
    const params = new URLSearchParams()
    if (keyword.trim()) params.append('q', keyword.trim())
    if (category) params.append('category', category)
    if (colour.trim()) params.append('colour', colour.trim())

    try {
      const res = await apiGet('search_items.php?' + params.toString(), getToken())
      if (res.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (!res.ok) {
        setError(res.data.error || 'Could not search. Please try again.')
      } else {
        setError('')
        setItems(res.data.items)
      }
    } catch {
      setError('Could not reach the server. Check that Apache is running.')
    }
    setLoading(false)
  }

  useEffect(() => {
    runSearch()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    runSearch()
  }

  function handleClear() {
    setKeyword('')
    setCategory('')
    setColour('')
    // Search again with empty filters on the next tick
    setTimeout(() => {
      document.getElementById('search-form').requestSubmit()
    }, 0)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <header className="navbar">
        <span className="brand">Kisumu CBD Recovery</span>
        <div className="nav-right">
          <span>{user && user.full_name}</span>
          <button className="link-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="content">
        <div className="content-header">
          <h2>Search Found Items</h2>
          <button className="primary small" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <section className="panel">
          <form id="search-form" onSubmit={handleSubmit}>
            <div className="filters">
              <input
                type="text"
                placeholder="Search brand or description..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Category (All)</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Colour"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="primary small" type="submit">Search</button>
              <button className="small-btn" type="button" onClick={handleClear}>Clear</button>
            </div>
          </form>
        </section>

        <section className="panel">
          {loading && <p>Searching...</p>}
          {error && <div className="message error">{error}</div>}

          {!loading && !error && items.length === 0 && (
            <p className="empty">
              No found items match your search. If you lost something, report it and we
              will match it for you.
            </p>
          )}

          {!loading && !error && items.length > 0 && (
            <p style={noteStyle}>{items.length} found item(s)</p>
          )}

          {items.map((item) => (
            <div className="report-card" key={item.report_id}>
              {item.photo_url ? (
                <img
                  className="thumb"
                  src={FILE_URL + '/' + item.photo_url}
                  alt={item.category}
                />
              ) : (
                <div className="thumb placeholder"></div>
              )}
              <div className="report-info">
                <strong>
                  {item.category}
                  {item.brand ? ' - ' + item.brand : ''}
                </strong>
                <p style={noteStyle}>
                  {item.colour}
                  {item.description ? '. ' + item.description : ''}
                </p>
                <p style={noteStyle}>Found on {formatDate(item.created_at)}</p>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '12px' }}>
            <p style={noteStyle}>Do you see your item? Report it as lost so we can verify you own it.</p>
            <button className="primary small" onClick={() => navigate('/reports/new')}>
              Report My Lost Item
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default SearchItems