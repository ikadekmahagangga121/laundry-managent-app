import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import RegisterOwner from './pages/RegisterOwner.jsx'
import RegisterCustomer from './pages/RegisterCustomer.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'

function PrivateRoute({ children, role }) {
  const { token, userRole } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/" replace />
  return children
}

function Nav() {
  const { token, userRole, logout } = useAuth()
  return (
    <div className="w-full bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link to="/" className="font-semibold">Laundry App</Link>
        <div className="flex gap-3 items-center">
          <Link to="/" className="text-sm">Home</Link>
          {!token && <>
            <Link to="/login" className="text-sm">Login</Link>
            <Link to="/register-owner" className="text-sm">Owner Register</Link>
            <Link to="/register-customer" className="text-sm">Customer Register</Link>
          </>}
          {token && userRole === 'owner' && <Link to="/owner" className="text-sm">Owner Dashboard</Link>}
          {token && userRole === 'customer' && <Link to="/customer" className="text-sm">Customer Dashboard</Link>}
          {token && <button onClick={logout} className="text-sm text-red-600">Logout</button>}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <div className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-owner" element={<RegisterOwner />} />
          <Route path="/register-customer" element={<RegisterCustomer />} />
          <Route path="/owner" element={<PrivateRoute role="owner"><OwnerDashboard /></PrivateRoute>} />
          <Route path="/customer" element={<PrivateRoute role="customer"><CustomerDashboard /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

