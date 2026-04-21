import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosConfig'

export default function RegisterPage() {
  const [role, setRole] = useState('USER')
  const [form, setForm] = useState({ username: '', email: '', password: '', adminSecret: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  if (user) return <Navigate to="/dashboard" replace />

  const isAdmin = role === 'ADMIN'

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setError('')
    setFieldErrors({})
    if (newRole === 'USER') setForm(f => ({ ...f, adminSecret: '' }))
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        role,
        ...(isAdmin && { adminSecret: form.adminSecret }),
      }
      const { data } = await api.post('/auth/register', payload)
      login(data)
      navigate('/dashboard')
    } catch (err) {
      const resp = err.response?.data
      if (resp?.errors) {
        setFieldErrors(resp.errors)
      } else {
        setError(resp?.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-container ${isAdmin ? 'admin-bg' : ''}`}>
      <div className={`auth-card ${isAdmin ? 'admin-theme' : ''}`}>
        <h2>Register</h2>

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
              placeholder="Min 3 characters"
              required
            />
            {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              required
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>

          {isAdmin && (
            <div className="form-group">
              <label>Admin Secret</label>
              <input
                type="password"
                name="adminSecret"
                value={form.adminSecret}
                onChange={handleChange}
                placeholder="Enter admin secret key"
                required
              />
              <span className="field-hint">Required to create an admin account</span>
            </div>
          )}

          {error && <div className="message error">{error}</div>}
          <button
            type="submit"
            className={`btn-primary ${isAdmin ? 'btn-admin' : ''}`}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
