import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import LeafletMap from '../components/LeafletMap'

export default function ProviderDashboard({ initialTab = "overview" }) {  
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [provider, setProvider] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  })
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    totalCommission: 0,
    totalAmount: 0,
    totalPayments: 0,
    averageEarnings: 0,
    availableBalance: 0,
    recentPayments: []
  })
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionData, setActionData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPaymentAcceptModal, setShowPaymentAcceptModal] = useState(false)

  useEffect(() => {
    console.log('ProviderDashboard useEffect - user:', user, 'role:', role)
    if (!user || role !== 'provider') {
      console.log('ProviderDashboard - Not authenticated, redirecting to login')
      navigate('/login/provider')
      return
    }
    console.log('ProviderDashboard - Loading provider data')
    loadProviderData()
  }, [user, role, navigate])

  async function loadProviderData() {
    try {
      setLoading(true)
      console.log('Loading provider data...')
      
      // Load provider profile, bookings
      const [providerRes, bookingsRes] = await Promise.all([
        api.get('/providers/me'),
        api.get('/bookings/provider/me')
      ])

      console.log('Provider data loaded:', providerRes.data)
      console.log('Bookings data loaded:', bookingsRes.data)
      
      setProvider(providerRes.data)
      
      // Calculate earnings from provider data
      const providerData = providerRes.data
      const paidBookings = bookingsRes.data.filter(b => b.paymentStatus === 'paid')
      
      // Calculate total earnings from paid bookings (90% of each booking)
      const calculatedTotalEarnings = paidBookings.reduce((sum, b) => {
        const totalAmount = b.finalAmount || b.amount || 0;
        // ALWAYS recalculate from actual total to ensure consistency
        const earnings = Math.round(totalAmount * 0.9);
        return sum + earnings;
      }, 0);
      
      // Calculate total commission from paid bookings (10% of each booking)
      const calculatedTotalCommission = paidBookings.reduce((sum, b) => {
        const totalAmount = b.finalAmount || b.amount || 0;
        // ALWAYS recalculate from actual total to ensure consistency
        const commission = Math.round(totalAmount * 0.1);
        return sum + commission;
      }, 0);
      
      console.log('Earnings calculation:', {
        providerTotalEarnings: providerData.totalEarnings,
        calculatedTotalEarnings: calculatedTotalEarnings,
        providerAvailableBalance: providerData.availableBalance,
        providerPlatformFees: providerData.platformFees,
        calculatedTotalCommission: calculatedTotalCommission,
        paidBookingsCount: paidBookings.length,
        bookings: paidBookings.map(b => ({
          id: b._id,
          amount: b.finalAmount || b.amount,
          providerEarnings: b.providerEarnings,
          platformCommission: b.platformCommission
        }))
      })
      
      setEarnings({
        totalEarnings: providerData.totalEarnings || calculatedTotalEarnings,
        totalCommission: providerData.platformFees || calculatedTotalCommission,
        totalAmount: providerData.totalEarnings || calculatedTotalEarnings,
        totalPayments: paidBookings.length,
        averageEarnings: paidBookings.length > 0 ? (providerData.totalEarnings || calculatedTotalEarnings) / paidBookings.length : 0,
        availableBalance: providerData.availableBalance || calculatedTotalEarnings,
        recentPayments: paidBookings.slice(0, 10).map(b => {
          const totalAmount = b.finalAmount || b.amount || 0;
          // ALWAYS recalculate from the actual total amount to ensure consistency
          const providerEarnings = Math.round(totalAmount * 0.9);
          const commission = Math.round(totalAmount * 0.1);
          
          console.log('Booking data:', {
            id: b._id,
            serviceType: b.serviceType,
            totalAmount: totalAmount,
            providerEarnings: providerEarnings,
            commission: commission
          });
          
          return {
            serviceType: b.serviceType,
            amount: totalAmount,
            providerEarnings: providerEarnings,
            platformCommission: commission,
            completedAt: b.paymentAcceptedAt || b.completedAt,
            clientName: b.userId?.name || 'Unknown'
          };
        })
      })
      
      setBookings(bookingsRes.data)
      
      // Calculate stats
      const stats = {
        total: bookingsRes.data.length,
        pending: bookingsRes.data.filter(b => b.status === 'pending').length,
        accepted: bookingsRes.data.filter(b => b.status === 'accepted').length,
        inProgress: bookingsRes.data.filter(b => b.status === 'in_progress').length,
        completed: bookingsRes.data.filter(b => b.status === 'completed').length,
        cancelled: bookingsRes.data.filter(b => b.status === 'cancelled').length
      }
      setStats(stats)
    } catch (error) {
      console.error('Failed to load provider data:', error)
      // Show error message to user
      alert('Failed to load provider data. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  function openActionModal(type, booking) {
    setActionType(type)
    setSelectedBooking(booking)
    setActionData({})
    setShowActionModal(true)
  }

  function openPaymentAcceptModal(booking) {
    setSelectedBooking(booking)
    setShowPaymentAcceptModal(true)
  }

  async function confirmPaymentAccepted() {
    if (!selectedBooking) return

    setSubmitting(true)
    try {
      await api.patch(`/bookings/${selectedBooking._id}/payment-accepted`, {
        paymentStatus: 'paid'
      })
      
      // Close modal
      setShowPaymentAcceptModal(false)
      
      // Show success
      alert('Payment accepted successfully!')
      
      // Reload provider data to update earnings
      const providerRes = await api.get('/providers/me')
      console.log('Reloaded provider after payment:', providerRes.data)
      setProvider(providerRes.data)
      
      // Reload bookings
      const bookingsRes = await api.get('/bookings/provider/me')
      setBookings(bookingsRes.data)
      
      // Recalculate earnings display from actual paid bookings
      const providerData = providerRes.data
      const paidBookings = bookingsRes.data.filter(b => b.paymentStatus === 'paid')
      
      // Calculate total earnings from paid bookings (90% of each booking)
      const calculatedTotalEarnings = paidBookings.reduce((sum, b) => {
        const totalAmount = b.finalAmount || b.amount || 0;
        const earnings = b.providerEarnings || Math.round(totalAmount * 0.9);
        return sum + earnings;
      }, 0);
      
      // Calculate total commission from paid bookings (10% of each booking)
      const calculatedTotalCommission = paidBookings.reduce((sum, b) => {
        const totalAmount = b.finalAmount || b.amount || 0;
        const commission = b.platformCommission || Math.round(totalAmount * 0.1);
        return sum + commission;
      }, 0);
      
      console.log('Recalculating earnings after payment:', {
        providerTotalEarnings: providerData.totalEarnings,
        calculatedTotalEarnings: calculatedTotalEarnings,
        providerAvailableBalance: providerData.availableBalance,
        paidBookingsCount: paidBookings.length
      })
      
      setEarnings({
        totalEarnings: providerData.totalEarnings || calculatedTotalEarnings,
        totalCommission: providerData.platformFees || calculatedTotalCommission,
        totalAmount: providerData.totalEarnings || calculatedTotalEarnings,
        totalPayments: paidBookings.length,
        averageEarnings: paidBookings.length > 0 ? (providerData.totalEarnings || calculatedTotalEarnings) / paidBookings.length : 0,
        availableBalance: providerData.availableBalance || calculatedTotalEarnings,
        recentPayments: paidBookings.slice(0, 10).map(b => {
          const totalAmount = b.finalAmount || b.amount || 0;
          // ALWAYS recalculate from the actual total amount
          const providerEarnings = Math.round(totalAmount * 0.9);
          const commission = Math.round(totalAmount * 0.1);
          return {
            serviceType: b.serviceType,
            amount: totalAmount,
            providerEarnings: providerEarnings,
            platformCommission: commission,
            completedAt: b.paymentAcceptedAt || b.completedAt,
            clientName: b.userId?.name || 'Unknown'
          };
        })
      })
      
    } catch (error) {
      console.error('Failed to accept payment:', error)
      alert('Failed to accept payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAction() {
    if (!selectedBooking) return

    setSubmitting(true)
    try {
      let endpoint = ''
      let data = {}

      switch (actionType) {
        case 'accept':
          endpoint = `/bookings/${selectedBooking._id}/accept`
          data = actionData
          break
        case 'reject':
          endpoint = `/bookings/${selectedBooking._id}/reject`
          data = { rejectionReason: actionData.rejectionReason }
          break
        case 'start':
          endpoint = `/bookings/${selectedBooking._id}/start`
          break
        case 'complete':
          endpoint = `/bookings/${selectedBooking._id}/complete`
          data = {}  // no final amount needed
          break
        default:
          throw new Error('Invalid action type')
      }

      await api.patch(endpoint, data)
      await loadProviderData() // Reload data
      setShowActionModal(false)
    } catch (error) {
      console.error('Action failed:', error)
      alert('Action failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'accepted': return '#10b981'
      case 'in_progress': return '#3b82f6'
      case 'completed': return '#059669'
      case 'cancelled': return '#ef4444'
      case 'rejected': return '#dc2626'
      default: return '#6b7280'
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'pending': return '⏳'
      case 'accepted': return '✅'
      case 'in_progress': return '🔄'
      case 'completed': return '🎉'
      case 'cancelled': return '❌'
      case 'rejected': return '🚫'
      default: return '❓'
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  function formatTime(timeString) {
    return timeString || 'Not specified'
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading provider dashboard...</div>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h3>Provider Profile Not Found</h3>
          <p>Please complete your provider profile setup.</p>
          <div style={{ marginTop: '1rem' }}>
            <button 
              onClick={() => navigate('/onboarding/provider')}
              className="btn btn-primary"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Provider Dashboard</h1>
        <p className="dashboard-subtitle">Manage your service bookings and profile</p>
      </div>

      {/* Provider Profile Summary */}
      <div className="provider-summary">
        <div className="provider-info">
          <h2>{provider.category?.charAt(0).toUpperCase() + provider.category?.slice(1)}</h2>
          <p><strong>Status:</strong> 
            {provider.verified ? (
              <span className="status-verified">✅ Verified</span>
            ) : (
              <span className="status-pending">⏳ Pending Verification</span>
            )}
          </p>
          <p><strong>Availability:</strong> 
            {provider.available ? (
              <span className="status-available">🟢 Available</span>
            ) : (
              <span className="status-unavailable">🔴 Unavailable</span>
            )}
          </p>
          {provider.rating && (
            <p><strong>Rating:</strong> 
              {'⭐'.repeat(Math.floor(provider.rating))}
              {provider.rating % 1 !== 0 && '⭐'}
              <span className="rating-text">({provider.rating.toFixed(1)})</span>
            </p>
          )}
        </div>
        
        <div className="provider-actions">
          <button 
            onClick={() => navigate('/profile')}
            className="btn btn-outline"
          >
            Edit Profile
          </button>
          <button 
            onClick={() => navigate('/provider/bookings')}
            className="btn btn-outline"
          >
            View All Bookings
          </button>
          <button 
            onClick={() => navigate('/provider/payments')}
            className="btn btn-outline"
          >
            💰 Payment Settings
          </button>
          <button 
            onClick={() => navigate('/provider/location')}
            className="btn btn-outline"
          >
            📍 Location Settings
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number warning">{stats.pending}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number info">{stats.inProgress}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-number success">{stats.completed}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button 
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({stats.accepted + stats.inProgress})
        </button>
        <button 
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({stats.completed})
        </button>
        {/* <button 
          className={`tab-button ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          💰 Earnings
        </button> */}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Recent Activity</h2>
            <div className="bookings-list">
              {bookings.slice(0, 5).map(booking => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-header">
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                      {getStatusIcon(booking.status)} {booking.status.replace('_', ' ')}
                    </span>
                    <span className="booking-date">{formatDate(booking.createdAt)}</span>
                  </div>
                  <div className="booking-details">
                    <h4>{booking.serviceType}</h4>
                    <p><strong>Client:</strong> {booking.userId?.name || 'Unknown'}</p>
                    <p><strong>Date:</strong> {formatDate(booking.preferredDate)} at {formatTime(booking.preferredTime)}</p>
                    <p><strong>Urgency:</strong> {booking.urgency}</p>
                  </div>
                  <div className="booking-actions">
                    <button 
                      onClick={() => navigate(`/booking/${booking._id}`)}
                      className="btn btn-outline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-tab">
            <h2>Pending Bookings</h2>
            {stats.pending === 0 ? (
              <p>No pending bookings</p>
            ) : (
              <div className="bookings-list">
                {bookings.filter(b => b.status === 'pending').map(booking => (
                  <div key={booking._id} className="booking-card pending">
                    <div className="booking-header">
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                        {getStatusIcon(booking.status)} Pending
                      </span>
                      <span className="booking-date">{formatDate(booking.createdAt)}</span>
                    </div>
                    <div className="booking-details">
                      <h4>{booking.serviceType}</h4>
                      <p><strong>Client:</strong> {booking.userId?.name || 'Unknown'}</p>
                      <p><strong>Email:</strong> {booking.userId?.email || 'Unknown'}</p>
                      <p><strong>Phone:</strong> {booking.contactPhone || 'Not provided'}</p>
                      <p><strong>Date:</strong> {formatDate(booking.preferredDate)} at {formatTime(booking.preferredTime)}</p>
                      <p><strong>Urgency:</strong> {booking.urgency}</p>
                      <p><strong>Address:</strong> {booking.address}</p>
                      <p><strong>Description:</strong> {booking.description}</p>
                      {booking.budget && <p><strong>Budget:</strong> INR {booking.budget}</p>}
                    </div>
                    <div className="booking-actions">
                      <button 
                        onClick={() => openActionModal('accept', booking)}
                        className="btn btn-success"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => openActionModal('reject', booking)}
                        className="btn btn-danger"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => navigate(`/booking/${booking._id}`)}
                        className="btn btn-outline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
{/* 
        {activeTab === 'active' && (
          <div className="active-tab">
            <h2>Active Bookings</h2>
            {stats.accepted + stats.inProgress === 0 ? (
              <p>No active bookings</p>
            ) : (
              <div className="bookings-list">
                {bookings.filter(b => ['accepted', 'in_progress'].includes(b.status)).map(booking => (
                  <div key={booking._id} className={`booking-card ${booking.status}`}>
                    <div className="booking-header">
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                        {getStatusIcon(booking.status)} {booking.status.replace('_', ' ')}
                      </span>
                      <span className="booking-date">{formatDate(booking.createdAt)}</span>
                    </div>
                    <div className="booking-details">
                      <h4>{booking.serviceType}</h4>
                      <p><strong>Client:</strong> {booking.userId?.name || 'Unknown'}</p>
                      <p><strong>Date:</strong> {formatDate(booking.preferredDate)} at {formatTime(booking.preferredTime)}</p>
                      <p><strong>Status:</strong> {booking.status.replace('_', ' ')}</p>
                      {booking.providerNotes && <p><strong>Your Notes:</strong> {booking.providerNotes}</p>}
                      {booking.estimatedDuration && <p><strong>Estimated Duration:</strong> {booking.estimatedDuration}</p>}
                    </div>
                    <div className="booking-actions">
                      {booking.status === 'accepted' && (
                        <button 
                          onClick={() => openActionModal('start', booking)}
                          className="btn btn-primary"
                        >
                          Start Work
                        </button>
                      )}
                      {booking.status === 'in_progress' && (
                        <button 
                          onClick={() => openActionModal('complete', booking)}
                          className="btn btn-success"
                        >
                          Mark Complete
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/booking/${booking._id}`)}
                        className="btn btn-outline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )} */}

        {activeTab === 'active' && (
          <div className="active-tab">
            <h2>Active Bookings</h2>
            {stats.accepted + stats.inProgress === 0 ? (
              <p>No active bookings</p>
            ) : (
              <div className="bookings-list">
                {bookings
                  .filter(b => ['accepted', 'in_progress'].includes(b.status))
                  .map(booking => (
                    <div key={booking._id} className={`booking-card ${booking.status}`}>
                      <div className="booking-header">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {getStatusIcon(booking.status)} {booking.status.replace('_', ' ')}
                        </span>
                        <span className="booking-date">{formatDate(booking.createdAt)}</span>
                      </div>

                      <div className="booking-details">
                        <h4>{booking.serviceType}</h4>
                        <p><strong>Client:</strong> {booking.userId?.name || 'Unknown'}</p>
                        <p><strong>Date:</strong> {formatDate(booking.preferredDate)} at {formatTime(booking.preferredTime)}</p>
                        <p><strong>Status:</strong> {booking.status.replace('_', ' ')}</p>
                        {booking.providerNotes && <p><strong>Your Notes:</strong> {booking.providerNotes}</p>}
                        {booking.estimatedDuration && <p><strong>Estimated Duration:</strong> {booking.estimatedDuration}</p>}

                        {/* --- ENHANCED LEAFLET MAPS PREVIEW --- */}
                        {booking.address && (
                          <LeafletMap
                            address={booking.address}
                            clientName={booking.userId?.name || 'Unknown Client'}
                            serviceType={booking.serviceType}
                            height="200px"
                            showNavigateButton={true}
                            className="booking-map"
                            coordinates={booking.coordinates}
                          />
                        )}
                      </div>

                      <div className="booking-actions">
                        {booking.status === 'accepted' && (
                          <button
                            onClick={() => openActionModal('start', booking)}
                            className="btn btn-primary"
                          >
                            Start Work
                          </button>
                        )}
                        {booking.status === 'in_progress' && (
                          <button
                            onClick={() => openActionModal('complete', booking)}
                            className="btn btn-success"
                          >
                            Mark Complete
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/booking/${booking._id}`)}
                          className="btn btn-outline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'completed' && (
          <div className="completed-tab">
            <h2>Completed Bookings</h2>
            {stats.completed === 0 ? (
              <p>No completed bookings</p>
            ) : (
              <div className="bookings-list">
                {bookings.filter(b => b.status === 'completed').map(booking => (
                  <div key={booking._id} className="booking-card completed">
                    <div className="booking-header">
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                        {getStatusIcon(booking.status)} Completed
                      </span>
                      <span className="booking-date">{formatDate(booking.completedAt || booking.createdAt)}</span>
                    </div>
                    <div className="booking-details">
                      <h4>{booking.serviceType}</h4>
                      <p><strong>Client:</strong> {booking.userId?.name || 'Unknown'}</p>
                      <p><strong>Completed:</strong> {formatDate(booking.completedAt || 'Unknown')}</p>
                      <p><strong>Final Amount:</strong> INR {((booking.finalAmount || booking.amount) / 100).toFixed(2)}</p>
                      {booking.rating && (
                        <div className="rating-display">
                          <strong>Rating:</strong> 
                          {'⭐'.repeat(Math.floor(booking.rating))}
                          {booking.rating % 1 !== 0 && '⭐'}
                          <span className="rating-text">({booking.rating.toFixed(1)})</span>
                        </div>
                      )}
                      {booking.review && (
                        <p><strong>Review:</strong> "{booking.review}"</p>
                      )}
                    </div>
                    <div className="booking-actions">
                      {booking.status === 'completed' && booking.paymentStatus !== 'paid' && (
                        <button 
                          onClick={() => openPaymentAcceptModal(booking)}
                          className="btn btn-success"
                        >
                          Payment Accepted
                        </button>
                      )}
                      
                      <button 
                        onClick={() => navigate(`/booking/${booking._id}`)}
                        className="btn btn-outline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="earnings-tab">
            <h2>💰 Earnings & Commission</h2>
            
            {/* Earnings Summary */}
            <div className="earnings-summary">
              <div className="earnings-card">
                <h3>Total Earnings</h3>
                <div className="earnings-amount">
                  ₹{(earnings.totalEarnings / 100).toFixed(2)}
                </div>
                <p>Your total earnings from all completed bookings</p>
              </div>
              
              <div className="earnings-card">
                <h3>Available Balance</h3>
                <div className="earnings-amount available">
                  ₹{(earnings.availableBalance / 100).toFixed(2)}
                </div>
                <p>Amount available for withdrawal</p>
              </div>
              
              <div className="earnings-card">
                <h3>Platform Commission</h3>
                <div className="earnings-amount commission">
                  ₹{(earnings.totalCommission / 100).toFixed(2)}
                </div>
                <p>Total commission paid to platform (10%)</p>
              </div>
              
              <div className="earnings-card">
                <h3>Total Bookings</h3>
                <div className="earnings-amount">
                  {earnings.totalPayments}
                </div>
                <p>Completed paid bookings</p>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="recent-payments">
              <h3>Recent Payments</h3>
              {(!earnings?.recentPayments || earnings.recentPayments.length === 0) ? (
                <p>No payment history available</p>
              ) : (
                <div className="payments-list">
                  {earnings.recentPayments.map((payment, index) => (
                    <div key={index} className="payment-card">
                      <div className="payment-header">
                        <span className="payment-service">{payment.serviceType}</span>
                        <span className="payment-date">
                          {new Date(payment.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="payment-details">
                        <div className="payment-amount">
                          <strong>Total: ₹{(payment.amount / 100).toFixed(2)}</strong>
                        </div>
                        <div className="payment-breakdown">
                          <span className="provider-earnings">
                            Your Earnings: ₹{(payment.providerEarnings / 100).toFixed(2)}
                          </span>
                          <span className="platform-commission">
                            Commission: ₹{(payment.platformCommission / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="payment-client">
                          Client: {payment.clientName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commission Structure Info */}
            <div className="commission-info">
              <h3>Commission Structure</h3>
              <div className="info-card">
                <div className="commission-breakdown">
                  <div className="breakdown-item">
                    <span className="label">Service Price:</span>
                    <span className="value">100%</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Your Earnings:</span>
                    <span className="value earnings">90%</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Platform Commission:</span>
                    <span className="value commission">10%</span>
                  </div>
                </div>
                <p className="commission-note">
                  Example: If a client pays ₹100 for your service, you earn ₹90 and the platform keeps ₹10 as commission.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {actionType === 'accept' && 'Accept Booking'}
                {actionType === 'reject' && 'Reject Booking'}
                {actionType === 'start' && 'Start Work'}
                {actionType === 'complete' && 'Complete Work'}
              </h3>
              <button 
                onClick={() => setShowActionModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {actionType === 'accept' && (
                <div className="form-group">
                  <label htmlFor="providerNotes">Notes for Client (Optional)</label>
                  <textarea
                    id="providerNotes"
                    value={actionData.providerNotes || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, providerNotes: e.target.value }))}
                    placeholder="Any additional notes or instructions for the client..."
                    rows={3}
                  />
                  
                  <label htmlFor="estimatedDuration">Estimated Duration (Optional)</label>
                  <input
                    id="estimatedDuration"
                    type="text"
                    value={actionData.estimatedDuration || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    placeholder="e.g., 2-3 hours, 1 day"
                  />
                  
                  {/* <label htmlFor="finalAmount">Final Amount (Optional)</label> */}
                  {/* <input
                    id="finalAmount"
                    type="number"
                    value={actionData.finalAmount || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, finalAmount: Number(e.target.value) }))}
                    placeholder="Final price in dollars"
                    min="0"
                    step="0.01"
                  /> */}
                </div>
              )}
              
              {actionType === 'reject' && (
                <div className="form-group">
                  <label htmlFor="rejectionReason">Reason for Rejection *</label>
                  <textarea
                    id="rejectionReason"
                    value={actionData.rejectionReason || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                    placeholder="Please provide a reason for rejecting this booking..."
                    rows={3}
                    required
                  />
                </div>
              )}
              
              {actionType === 'complete' && (
                <p style={{ marginTop: "1rem" }}>
                  Are you sure you want to mark this work as completed?
                </p>
              )}

            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowActionModal(false)}
                className="btn btn-outline"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                className={`btn ${
                  actionType === 'accept' || actionType === 'start' || actionType === 'complete' 
                    ? 'btn-success' 
                    : 'btn-danger'
                }`}
                disabled={submitting || (actionType === 'reject' && !actionData.rejectionReason)}
              >
                {submitting ? 'Processing...' : 
                  actionType === 'accept' ? 'Accept' :
                  actionType === 'reject' ? 'Reject' :
                  actionType === 'start' ? 'Start Work' :
                  actionType === 'complete' ? 'Complete' : 'Confirm'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Acceptance Modal */}
      {showPaymentAcceptModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Payment Received</h3>
              <button 
                onClick={() => setShowPaymentAcceptModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="payment-confirmation">
                <p>Have you received payment from the client for this completed service?</p>
                
                {selectedBooking && (
                  <div className="payment-summary">
                    <h4>Service Details</h4>
                    <p><strong>Service:</strong> {selectedBooking.serviceType}</p>
                    <p><strong>Client:</strong> {selectedBooking.userId?.name || 'Unknown'}</p>
                    <p><strong>Amount:</strong> INR {((selectedBooking.finalAmount || selectedBooking.amount) / 100).toFixed(2)}</p>
                    <p><strong>Completed:</strong> {formatDate(selectedBooking.completedAt || 'Unknown')}</p>
                  </div>
                )}
                
                <div className="payment-note">
                  <p><strong>Note:</strong> Once you confirm payment received, the booking will be marked as paid and your earnings will be updated.</p>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowPaymentAcceptModal(false)}
                className="btn btn-outline"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmPaymentAccepted}
                className="btn btn-success"
                disabled={submitting}
              >
                {submitting ? 'Confirming...' : 'Yes, Payment Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


