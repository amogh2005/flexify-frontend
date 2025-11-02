import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'user'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email, role })
      setMessage('Password reset instructions have been sent to your email. Please check your inbox.')
    } catch (err) {
      console.error('Forgot password error:', err)
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 className="form-title">Forgot Password</h1>
      <p className="text-center mb-4" style={{ color: '#64748b' }}>
        Enter your email address and we'll send you instructions to reset your password
      </p>

      {message && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          color: '#0369a1',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {message}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="form-submit btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>

      <div className="form-footer">
        <p>Remember your password? <Link to={`/login/${role}`}>Back to Login</Link></p>
      </div>
    </div>
  )
}

