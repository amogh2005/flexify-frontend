import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, role } = useAuth()
  const [paymentStatus, setPaymentStatus] = useState('checking')
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    if (!user || role !== 'user') {
      navigate('/login/user')
      return
    }

    // Check payment status
    checkPaymentStatus()
  }, [user, role, navigate])

  async function checkPaymentStatus() {
    try {
      const transactionId = searchParams.get('transactionId')
      const bookingId = searchParams.get('bookingId')
      
      if (bookingId) {
        // Check payment status for the booking
        const { data } = await api.get(`/payments/status/${bookingId}`)
        
        if (data.paymentStatus === 'paid') {
          setPaymentStatus('success')
          setBooking(data)
        } else if (data.paymentStatus === 'failed') {
          setPaymentStatus('failed')
        } else {
          setPaymentStatus('processing')
        }
      } else {
        setPaymentStatus('error')
      }
    } catch (error) {
      console.error('Failed to check payment status:', error)
      setPaymentStatus('error')
    }
  }

  function getStatusMessage() {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: '✅',
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully.',
          color: '#10b981'
        }
      case 'failed':
        return {
          icon: '❌',
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          color: '#ef4444'
        }
      case 'processing':
        return {
          icon: '⏳',
          title: 'Processing Payment',
          message: 'Your payment is being processed. Please wait...',
          color: '#f59e0b'
        }
      case 'error':
        return {
          icon: '⚠️',
          title: 'Error',
          message: 'Unable to verify payment status. Please contact support.',
          color: '#6b7280'
        }
      default:
        return {
          icon: '🔄',
          title: 'Checking Payment',
          message: 'Please wait while we verify your payment...',
          color: '#3b82f6'
        }
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Payment Status</h1>
      </div>

      <div className="booking-card" style={{ 
        background: '#fff', 
        padding: '2rem', 
        borderRadius: 8, 
        textAlign: 'center',
        maxWidth: 500,
        margin: '2rem auto'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {statusInfo.icon}
        </div>
        
        <h2 style={{ color: statusInfo.color, marginBottom: '1rem' }}>
          {statusInfo.title}
        </h2>
        
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
          {statusInfo.message}
        </p>

        {paymentStatus === 'success' && (
          <div style={{ 
            background: '#f0f9ff', 
            padding: '1rem', 
            borderRadius: 6, 
            marginBottom: '2rem',
            border: '1px solid #0ea5e9'
          }}>
            <p><strong>Transaction ID:</strong> {booking?.paymentIntentId}</p>
            <p><strong>Paid At:</strong> {booking?.paidAt ? new Date(booking.paidAt).toLocaleString() : 'N/A'}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/dashboard/user')}
            className="btn btn-primary"
          >
            Go to Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/bookings')}
            className="btn btn-outline"
          >
            View Bookings
          </button>
        </div>

        {paymentStatus === 'processing' && (
          <div style={{ marginTop: '2rem' }}>
            <button 
              onClick={checkPaymentStatus}
              className="btn btn-outline"
            >
              Refresh Status
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
