import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { data } = await api.post('/auth/login', { email, password, role })
      login(data.token, data.role)
      navigate(role === 'owner' ? '/owner' : '/customer')
    } catch (e) {
      setError(e.response?.data?.message || 'Login gagal')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow border">
      <h2 className="text-lg font-semibold mb-4">Login</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border rounded p-2">
          <option value="customer">Customer</option>
          <option value="owner">Owner</option>
        </select>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded p-2" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border rounded p-2" />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="bg-blue-600 text-white rounded px-4 py-2">Login</button>
      </form>
    </div>
  )
}

