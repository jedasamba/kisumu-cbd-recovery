import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { apiGet } from '../api'
import { getToken, getUser, logout } from '../auth'

function HeatLayer({ points }) {
  const map = useMap()

  useEffect(() => {
    const layer = L.heatLayer(
      points.map((p) => [p[0], p[1], 1]),
      { radius: 30, blur: 20, maxZoom: 17 }
    )
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [points, map])

  return null
}

function AdminHeatmap() {
  const navigate = useNavigate()
  const user = getUser()
  const [type, setType] = useState('lost')
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPoints() {
      setLoading(true)
      const res = await apiGet('admin_heatmap.php?type=' + type, getToken())
      if (res.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (!res.ok) {
        setError(res.data.error || 'Could not load the heatmap.')
      } else {
        setError('')
        setPoints(res.data.points)
      }
      setLoading(false)
    }
    loadPoints()
  }, [type])

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
          <h2>Loss Hotspots</h2>
          <button className="primary small" onClick={() => navigate('/admin')}>
            Back to Admin
          </button>
        </div>

        <div className="panel">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <button className={type === 'lost' ? 'primary small' : 'small-btn'} onClick={() => setType('lost')}>
              Lost items
            </button>
            <button className={type === 'found' ? 'primary small' : 'small-btn'} onClick={() => setType('found')}>
              Found items
            </button>
            <button className={type === 'all' ? 'primary small' : 'small-btn'} onClick={() => setType('all')}>
              All reports
            </button>
          </div>

          {error && <div className="message error">{error}</div>}
          {loading && <p>Loading...</p>}
          {!loading && !error && (
            <p style={{ fontSize: '0.85rem', color: '#5f6368' }}>
              {points.length} report location(s) shown. Red areas have the most reports.
            </p>
          )}

          <MapContainer
            center={[-0.0917, 34.768]}
            zoom={15}
            style={{ height: '450px', width: '100%', borderRadius: '8px' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatLayer points={points} />
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

export default AdminHeatmap