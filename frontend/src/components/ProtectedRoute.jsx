import { Navigate } from 'react-router-dom'
import { getToken, getUser } from '../auth'

// Wrap any page that needs a logged-in user.
// Pass role="admin" for admin-only pages.
function ProtectedRoute({ children, role }) {
  const token = getToken()
  const user = getUser()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default ProtectedRoute