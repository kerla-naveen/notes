import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosConfig'

export default function LoginPage() {
  const [role, setRole] = useState('USER')
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  if (user) return <Navigate to="/dashboard" replace />

  const isAdmin = role === 'ADMIN'

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setError('')
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      if (isAdmin && data.role !== 'ADMIN') {
        setError('This account does not have admin privileges.')
        return
      }
      if (!isAdmin && data.role === 'ADMIN') {
        setError('Admin accounts must use the Admin tab.')
        return
      }
      login(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-container ${isAdmin ? 'admin-bg' : ''}`}>
      <div className={`auth-card ${isAdmin ? 'admin-theme' : ''}`}>
        <h2>Login</h2>

        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'USER' ? 'active-user' : ''}`}
            onClick={() => handleRoleChange('USER')}
          >
            User
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'ADMIN' ? 'active-admin' : ''}`}
            onClick={() => handleRoleChange('ADMIN')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <div className="message error">{error}</div>}
          <button
            type="submit"
            className={`btn-primary ${isAdmin ? 'btn-admin' : ''}`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
