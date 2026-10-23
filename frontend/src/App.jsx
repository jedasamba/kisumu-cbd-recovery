import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ReportForm from './pages/ReportForm'
import AdminDashboard from './pages/AdminDashboard'
import ClaimItem from './pages/ClaimItem'
import Messages from './pages/Messages'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/reports/new" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
      <Route path="/claim/:matchId" element={<ProtectedRoute><ClaimItem /></ProtectedRoute>} />
      <Route path="/messages/:matchId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  )
}

export default App