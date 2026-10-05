import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPost } from '../api'

function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const result = await apiPost('register.php', form)
      if (result.ok) {
        setSuccess(true)
        setForm({ full_name: '', email: '', password: '', phone: '' })
      } else {
        setError(result.data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Could not reach the server. Check that Apache is running.')
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Create Your Account</h1>

        {success && (
          <p className="message success">
            Account created. You can now <Link to="/login">log in</Link>.
          </p>
        )}
        {error && <p className="message error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="John Doe"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="john.doe@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <label htmlFor="phone">Phone Number (Optional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+254 7XX XXX XXX"
            value={form.phone}
            onChange={handleChange}
          />

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register