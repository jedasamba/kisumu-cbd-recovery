import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ReportForm from './pages/ReportForm'
import AdminDashboard from './pages/AdminDashboard'
import AdminHeatmap from './pages/AdminHeatmap'
import AdminClaims from './pages/AdminClaims'
import ClaimItem from './pages/ClaimItem'
import Messages from './pages/Messages'
import QRCodePage from './pages/QRCodePage'
import PublicItem from './pages/PublicItem'
import PublicDashboard from './pages/PublicDashboard'
import Notifications from './pages/Notifications'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recovery" element={<PublicDashboard />} />
      <Route path="/item/:reportId" element={<PublicItem />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/reports/new" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
      <Route path="/claim/:matchId" element={<ProtectedRoute><ClaimItem /></ProtectedRoute>} />
      <Route path="/messages/:matchId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/qr/:reportId" element={<ProtectedRoute><QRCodePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/heatmap" element={<ProtectedRoute role="admin"><AdminHeatmap /></ProtectedRoute>} />
      <Route path="/admin/claims" element={<ProtectedRoute role="admin"><AdminClaims /></ProtectedRoute>} />
    </Routes>
  )
}

export default App