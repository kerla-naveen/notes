import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosConfig'

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const FILTER_OPTIONS = ['ALL', ...STATUS_OPTIONS]
const STATUS_CLASS = {
  PENDING: 'badge-gray',
  IN_PROGRESS: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
}
const EMPTY_FORM = { title: '', description: '', status: 'PENDING' }

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [newTask, setNewTask] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => { fetchTasks() }, [])

  const flash = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks')
      setTasks(data)
    } catch {
      flash('Failed to load tasks', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/tasks', newTask)
      setTasks([data, ...tasks])
      setNewTask(EMPTY_FORM)
      flash('Task created')
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create task', 'error')
    }
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditForm({ title: task.title, description: task.description || '', status: task.status })
  }

  const handleUpdate = async (id) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, editForm)
      setTasks(tasks.map(t => t.id === id ? data : t))
      setEditingId(null)
      flash('Task updated')
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to update task', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(tasks.filter(t => t.id !== id))
      flash('Task deleted')
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to delete task', 'error')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleTasks = filterStatus === 'ALL'
    ? tasks
    : tasks.filter(t => t.status === filterStatus)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Notes App</h1>
        <div className="header-right">
          <span>Welcome, <strong>{user?.username}</strong></span>
          {isAdmin && <span className="role-badge">ADMIN</span>}
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="card">
          <h3>New Task</h3>
          <form onSubmit={handleCreate} className="task-form">
            <input
              type="text"
              placeholder="Title *"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            />
            <select
              value={newTask.status}
              onChange={e => setNewTask({ ...newTask, status: e.target.value })}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>
              {isAdmin ? 'All Tasks' : 'My Tasks'}
              <span className="count"> ({visibleTasks.length}{filterStatus !== 'ALL' ? ` ${filterStatus.replace('_', ' ')}` : ''})</span>
            </h3>
            <div className="filter-tabs">
              {FILTER_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : visibleTasks.length === 0 ? (
            <p className="muted">No tasks{filterStatus !== 'ALL' ? ` with status ${filterStatus.replace('_', ' ')}` : ''}.</p>
          ) : (
            <ul className="task-list">
              {visibleTasks.map(task => (
                <li key={task.id} className="task-item">
                  {editingId === task.id ? (
                    <div className="task-edit-form">
                      <input
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Title"
                      />
                      <input
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description"
                      />
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                      <div className="task-actions">
                        <button onClick={() => handleUpdate(task.id)} className="btn-sm btn-success">Save</button>
                        <button onClick={() => setEditingId(null)} className="btn-sm btn-secondary">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="task-content">
                      <div className="task-info">
                        <div className="task-title-row">
                          <span className="task-title">{task.title}</span>
                          {isAdmin && task.username !== user?.username && (
                            <span className="task-owner">@{task.username}</span>
                          )}
                        </div>
                        {task.description && (
                          <span className="task-description">{task.description}</span>
                        )}
                        <span className="task-date">Created {formatDate(task.createdAt)}</span>
                      </div>
                      <div className="task-meta">
                        <span className={`badge ${STATUS_CLASS[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <div className="task-actions">
                          <button onClick={() => startEdit(task)} className="btn-sm btn-secondary">Edit</button>
                          <button onClick={() => handleDelete(task.id)} className="btn-sm btn-danger">Delete</button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
