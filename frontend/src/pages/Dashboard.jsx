import { useNavigate } from 'react-router-dom'
import { getUser, logout } from '../auth'

function Dashboard() {
  const navigate = useNavigate()
  const user = getUser()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <header className="navbar">
        <span className="brand">Kisumu CBD Recovery</span>
        <div className="nav-right">
          <span>{user.full_name}</span>
          <button className="link-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <div className="content-header">
          <h1>My Reports</h1>
                    <button
            className="primary small"
            onClick={() => navigate('/reports/new')}
          >
            Submit New Report
          </button>
        </div>
        <p>You have no reports yet. The report form comes in the next steps.</p>
      </main>
    </div>
  )
}

export default Dashboard