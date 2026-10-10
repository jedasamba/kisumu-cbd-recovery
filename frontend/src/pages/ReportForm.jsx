import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiPostForm } from '../api'
import { getToken, logout } from '../auth'
import MapPicker from '../components/MapPicker'

const CATEGORIES = [
  'Phone', 'Wallet', 'ID Card', 'Keys', 'Bag',
  'Electronics', 'Documents', 'Other',
]

function ReportForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    report_type: 'lost',
    category: '',
    brand: '',
    colour: '',
    description: '',
    latitude: '',
    longitude: '',
    hidden_details: '',
  })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isFound = form.report_type === 'found'

  // The pin only shows when both coordinates are valid numbers
  const lat = parseFloat(form.latitude)
  const lng = parseFloat(form.longitude)
  const pinPosition = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function handlePick(latitude, longitude) {
    setForm({
      ...form,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    })
  }

  function handlePhoto(event) {
    const file = event.target.files[0]
    setError('')

    if (!file) {
      setPhoto(null)
      return
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Photo must be a JPG or PNG image')
      event.target.value = ''
      setPhoto(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be 5MB or smaller')
      event.target.value = ''
      setPhoto(null)
      return
    }
    setPhoto(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!pinPosition) {
      setError('Please drop a pin on the map to set the location')
      return
    }

    const data = new FormData()
    data.append('report_type', form.report_type)
    data.append('category', form.category)
    data.append('brand', form.brand)
    data.append('colour', form.colour)
    data.append('description', form.description)
    data.append('latitude', form.latitude)
    data.append('longitude', form.longitude)
    if (isFound) {
      data.append('hidden_details', form.hidden_details)
    }
    if (photo) {
      data.append('photo', photo)
    }

    setLoading(true)
    try {
      const result = await apiPostForm('reports.php', data, getToken())

      if (result.status === 401) {
        logout()
        navigate('/login')
        return
      }
      if (result.ok) {
        navigate('/dashboard')
      } else {
        setError(result.data.error || 'Could not submit the report')
      }
    } catch (err) {
      setError('Could not reach the server. Check that Apache is running.')
    }
    setLoading(false)
  }

  return (
    <div className="page top">
      <div className="card wide">
        <Link to="/dashboard">&larr; Back</Link>
        <h1>Report Submission</h1>

        <div className="tabs">
          <button
            type="button"
            className={!isFound ? 'tab active' : 'tab'}
            onClick={() => setForm({ ...form, report_type: 'lost' })}
          >
            I Lost an Item
          </button>
          <button
            type="button"
            className={isFound ? 'tab active' : 'tab'}
            onClick={() => setForm({ ...form, report_type: 'found' })}
          >
            I Found an Item
          </button>
        </div>

        {error && <p className="message error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="category">Item Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label htmlFor="brand">Brand (optional)</label>
          <input
            id="brand"
            name="brand"
            type="text"
            placeholder="e.g. Nike, Apple"
            value={form.brand}
            onChange={handleChange}
          />

          <label htmlFor="colour">Colour</label>
          <input
            id="colour"
            name="colour"
            type="text"
            placeholder="e.g. Red, Silver"
            value={form.colour}
            onChange={handleChange}
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            maxLength="500"
            placeholder="Describe the item and where it was lost or found"
            value={form.description}
            onChange={handleChange}
          />
          <p className="counter">{form.description.length}/500</p>

          <label htmlFor="photo">Upload Photo (JPG/PNG, max 5MB)</label>
          <input
            id="photo"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handlePhoto}
          />

          <label>Pin the exact location on the map</label>
          <MapPicker position={pinPosition} onPick={handlePick} />
          <p className="hint">Click the map to drop the pin. You can also type the coordinates.</p>
          <div className="coords">
            <input
              name="latitude"
              type="text"
              placeholder="Latitude"
              value={form.latitude}
              onChange={handleChange}
            />
            <input
              name="longitude"
              type="text"
              placeholder="Longitude"
              value={form.longitude}
              onChange={handleChange}
            />
          </div>

          {isFound && (
            <>
              <label htmlFor="hidden_details">
                Private identifying detail (not shown publicly, used for ownership verification)
              </label>
              <textarea
                id="hidden_details"
                name="hidden_details"
                rows="2"
                placeholder="e.g. A detail only the owner would know"
                value={form.hidden_details}
                onChange={handleChange}
                required
              />
            </>
          )}

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ReportForm