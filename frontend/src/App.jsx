import { Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/login"
        element={<p style={{ padding: '2rem' }}>Login page coming in the next step.</p>}
      />
    </Routes>
  )
}

export default App