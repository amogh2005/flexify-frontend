import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import LeafletLocationPicker from '../components/LeafletLocationPicker'
import './UserBooking.css'

export default function UserBooking() {
  const [currentStep, setCurrentStep] = useState(1)
  const [bookingData, setBookingData] = useState({
    // Basic Booking Details
    serviceType: '',
    serviceCategory: '',
    duration: '',
    durationValue: 1,
    location: '',
    coordinates: { lat: 0, lng: 0 },
    timeSlot: '',
    date: '',
    urgency: 'normal', // normal, urgent, emergency
    
    // Advanced Options
    skillTags: [],
    specialRequirements: '',
    insuranceRequired: false,
    backgroundCheckRequired: false,
    
    // Pricing
    basePrice: 0,
    surgeMultiplier: 1,
    insuranceCost: 0,
    totalPrice: 0,
    urgencyExtra: 0,
    
    // Worker Selection
    selectedWorker: null,
    recommendedWorkers: [],
    workerFilters: {
      minRating: 4.0,
      maxDistance: 10,
      verifiedOnly: true,
      availableNow: false
    }
  })
  
  const [availableWorkers, setAvailableWorkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWorkerDetails, setShowWorkerDetails] = useState(false)
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState(null)
  const [showChat, setShowChat] = useState(false)
  
  // Payment states
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showAIChatbot, setShowAIChatbot] = useState(false)
  
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mapRef = useRef()
  const chatbotRef = useRef()

  const totalSteps = 4
  // Initialize from Services page selections
  useEffect(() => {
    const st = location.state || {}
    if (st.selectedCategory) {
      updateBookingData('serviceCategory', st.selectedCategory)
    }
    if (st.providerId) {
      // Preselect a provider (we will fetch details to ensure valid)
      (async () => {
        try {
          const { data } = await api.get(`/providers/${st.providerId}`)
          confirmWorker(data)
        } catch {}
      })()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Service categories with detailed information
  const serviceCategories = {
    'maid': {
      name: 'Housekeeping & Cleaning',
      icon: '🧹',
      basePrice: 200,
      skills: ['Deep Cleaning', 'Laundry', 'Cooking', 'Pet Care', 'Elder Care'],
      description: 'Professional housekeeping and cleaning services'
    },
    'plumber': {
      name: 'Plumbing Services',
      icon: '🔧',
      basePrice: 300,
      skills: ['Pipe Repair', 'Drain Cleaning', 'Fixture Installation', 'Water Heater', 'Emergency Repair'],
      description: 'Expert plumbing and water system services'
    },
    'electrician': {
      name: 'Electrical Services',
      icon: '⚡',
      basePrice: 350,
      skills: ['Wiring', 'Fixture Installation', 'Safety Inspection', 'Emergency Repair', 'Smart Home Setup'],
      description: 'Certified electrical installation and repair'
    },
    'cook': {
      name: 'Cooking & Catering',
      icon: '👨‍🍳',
      basePrice: 400,
      skills: ['Indian Cuisine', 'International Cuisine', 'Vegan Cooking', 'Party Catering', 'Dietary Specialties'],
      description: 'Professional cooking and catering services'
    },
    'driver': {
      name: 'Transportation',
      icon: '🚗',
      basePrice: 250,
      skills: ['City Driving', 'Highway Driving', 'Luxury Cars', 'Commercial Vehicles', 'Emergency Transport'],
      description: 'Safe and reliable transportation services'
    },
    'cleaner': {
      name: 'Specialized Cleaning',
      icon: '🧽',
      basePrice: 250,
      skills: ['Carpet Cleaning', 'Window Cleaning', 'Deep Cleaning', 'Post-Construction', 'Commercial Cleaning'],
      description: 'Specialized cleaning and maintenance services'
    }
  }

  const durationOptions = [
    { value: 'hourly', label: 'Hourly', multiplier: 1 },
    { value: 'daily', label: 'Daily (8 hours)', multiplier: 8 },
    { value: 'weekly', label: 'Weekly', multiplier: 40 },
    { value: 'monthly', label: 'Monthly', multiplier: 160 }
  ]

  const urgencyLevels = [
    { value: 'normal', label: 'Normal', multiplier: 1, color: '#10b981' },
    { value: 'urgent', label: 'Urgent (Same Day)', multiplier: 1.5, color: '#f59e0b' },
    { value: 'emergency', label: 'Emergency (2-4 hours)', multiplier: 2, color: '#ef4444' }
  ]

  const updateBookingData = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculatePricing = () => {
    const category = serviceCategories[bookingData.serviceCategory];
    if (!category) return;
  
    const basePrice = category.basePrice;
  
    // urgencyExtra = basePrice × (multiplier - 1)
    const urgencyObj = urgencyLevels.find(u => u.value === bookingData.urgency);
    const urgencyExtra = basePrice * (urgencyObj.multiplier - 1);
  
    // ⭐ FINAL CORRECT TOTAL
    const total = basePrice + urgencyExtra;
  
    setBookingData(prev => ({
      ...prev,
      basePrice: basePrice,
      urgencyExtra: urgencyExtra,
      totalPrice: total   // THIS FIXES YOUR ISSUE
    }));
  };
  
  

  const findAvailableWorkers = async () => {
    if (!bookingData.serviceCategory || !bookingData.location) return

    setLoading(true)
    try {
      const response = await api.get('/providers/search/nearby', {
        params: {
          category: bookingData.serviceCategory,
          longitude: bookingData.coordinates.lng,
          latitude: bookingData.coordinates.lat,
          maxDistance: bookingData.workerFilters.maxDistance,
          verified: bookingData.workerFilters.verifiedOnly,
          available: true
        }
      })

      // AI-driven worker matching
      const matchedWorkers = response.data.map(worker => {
        let score = 0
        
        // Rating score (40% weight)
        score += (worker.rating || 0) * 0.4
        
        // Trust score (30% weight)
        score += (worker.trustScore || 0) * 0.3
        
        // Performance score (20% weight)
        const completionRate = worker.completedBookings > 0 ? 
          (worker.completedBookings / (worker.completedBookings + worker.cancelledBookings)) : 0
        score += completionRate * 0.2
        
        // Proximity score (10% weight)
        const distance = calculateDistance(
          bookingData.coordinates.lat, 
          bookingData.coordinates.lng, 
          worker.location.coordinates[1], 
          worker.location.coordinates[0]
        )
        score += Math.max(0, (10 - distance) / 10) * 0.1

        return { ...worker, matchScore: score }
      })

      // Sort by match score
      const sortedWorkers = matchedWorkers.sort((a, b) => b.matchScore - a.matchScore)
      
      setAvailableWorkers(sortedWorkers)
      setBookingData(prev => ({
        ...prev,
        recommendedWorkers: sortedWorkers.slice(0, 5)
      }))
    } catch (error) {
      console.error('Error finding workers:', error)
      setError('Failed to find available workers')
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const selectWorker = (worker) => {
    setSelectedWorkerDetails(worker)
    setShowWorkerDetails(true)
  }

  const confirmWorker = (worker) => {
    setBookingData(prev => ({
      ...prev,
      selectedWorker: worker
    }))
    setShowWorkerDetails(false)
    nextStep()
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleLocationSelect = (location, coordinates) => {
    updateBookingData('location', location)
    if (coordinates) {
      updateBookingData('coordinates', coordinates)
    }
  }

  // Payment handling functions
  const handleCreatePaymentOrder = async () => {
    if (!bookingData.selectedWorker) {
      setError('Please select a worker first')
      return
    }

    setPaymentLoading(true)
    try {
      const response = await api.post('/payments/create-order', {
        bookingId: bookingData.bookingId
      })
      
      if (response.data.success) {
        setPaymentOrder(response.data)
        setShowPaymentModal(true)
        loadRazorpayScript()
      } else {
        setError('Failed to create payment order')
      }
    } catch (error) {
      console.error('Payment order creation failed:', error)
      setError('Failed to create payment order. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpayPayment = async () => {
    if (!paymentOrder) return

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
      amount: paymentOrder.order.amount,
      currency: paymentOrder.order.currency,
      name: 'Flexify',
      description: `Payment for ${bookingData.serviceType}`,
      order_id: paymentOrder.order.id,
      handler: async (response) => {
        try {
          const verifyResponse = await api.post('/payments/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            payment_method: 'card'
          })

          if (verifyResponse.data.success) {
            setShowPaymentModal(false)
            setError('')
            alert('Payment successful! Your booking has been confirmed.')
            navigate('/dashboard/user')
          } else {
            setError('Payment verification failed')
          }
        } catch (error) {
          console.error('Payment verification failed:', error)
          setError('Payment verification failed. Please contact support.')
        }
      },
      prefill: {
        name: auth.user?.name || '',
        email: auth.user?.email || '',
        contact: auth.user?.phone || ''
      },
      theme: {
        color: '#1e40af'
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const handleDateChange = (date) => {
    updateBookingData('date', date)
    // Recalculate pricing based on new date
    setTimeout(calculatePricing, 100)
  }

  const handleTimeSlotChange = (timeSlot) => {
    updateBookingData('timeSlot', timeSlot)
    // Recalculate pricing based on new time
    setTimeout(calculatePricing, 100)
  }

  const handleUrgencyChange = (urgency) => {
    setBookingData(prev => ({
      ...prev,
      urgency
    }));
  };
  
  const createBooking = async () => {
    if (!bookingData.selectedWorker) {
      setError('Please select a worker')
      return
    }

    setLoading(true)
    try {
      // Prepare required fields with safe defaults if user skipped
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const defaultDate = `${yyyy}-${mm}-${dd}`;

      const duration = bookingData.duration || 'hourly'
      const durationValue = bookingData.durationValue || 1
      const location = bookingData.location || 'Customer location'
      const coordinates = bookingData.coordinates?.lat || bookingData.coordinates?.lng
        ? bookingData.coordinates
        : { lat: 19.0760, lng: 72.8777 }
      const timeSlot = bookingData.timeSlot || 'Morning (6 AM - 12 PM)'
      const date = bookingData.date || defaultDate
      const serviceType = bookingData.serviceType || serviceCategories[bookingData.serviceCategory]?.name || bookingData.serviceCategory

      // Ensure base/total pricing
      let basePrice = bookingData.basePrice
      let surgeMultiplier = bookingData.surgeMultiplier || 1
      if (!basePrice || basePrice <= 0) {
        const base = serviceCategories[bookingData.serviceCategory]?.basePrice || 200
        const mult = duration === 'hourly' ? 1 : duration === 'daily' ? 8 : duration === 'weekly' ? 40 : duration === 'monthly' ? 160 : 1
        basePrice = base * mult
      }
      const insuranceCost = bookingData.insuranceRequired ? Math.round(basePrice * 0.1) : 0
      const totalPrice = bookingData.totalPrice

      const bookingPayload = {
        workerId: bookingData.selectedWorker._id,
        serviceType,
        serviceCategory: bookingData.serviceCategory,
        duration,
        durationValue,
        location,
        coordinates,
        timeSlot,
        date,
        urgency: bookingData.urgency,
        skillTags: bookingData.skillTags,
        specialRequirements: bookingData.specialRequirements,
        insuranceRequired: bookingData.insuranceRequired,
        backgroundCheckRequired: bookingData.backgroundCheckRequired,
        totalPrice,
        basePrice,
        surgeMultiplier,
        insuranceCost
      }

      const response = await api.post('/bookings/create', bookingPayload)
      
      // Navigate to booking confirmation
      navigate(`/bookings`, { 
        state: { message: 'Booking created successfully!' } 
      })
    } catch (error) {
      console.error('Error creating booking:', error)
      const msg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to create booking. Please check required fields.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (bookingData.serviceCategory) {
      calculatePricing();
    }
  }, [bookingData.serviceCategory, bookingData.urgency]);
  

  useEffect(() => {
    if (bookingData.serviceCategory && bookingData.location) {
      findAvailableWorkers()
    }
  }, [bookingData.serviceCategory, bookingData.location])

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4].map(step => (
        <div 
          key={step} 
          className={`step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
        >
          <div className="step-number">{step}</div>
          <div className="step-label">
            {step === 1 && 'Service Details'}
            {step === 2 && 'Location & Time'}
            {step === 3 && 'Pricing & Options'}
            {step === 4 && 'Confirm Booking'}
          </div>
        </div>
      ))}
    </div>
  )

  const renderServiceDetails = () => (
    <div className="booking-step">
      <h2>Select Your Service</h2>
      <p>Choose the type of service you need</p>
      
      <div className="service-categories-grid">
        {Object.entries(serviceCategories).map(([key, category]) => (
          <div 
            key={key}
            className={`service-category-card ${bookingData.serviceCategory === key ? 'selected' : ''}`}
            onClick={() => updateBookingData('serviceCategory', key)}
          >
            <div className="category-icon">{category.icon}</div>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
            <div className="category-price">Starting from ₹{category.basePrice}</div>
            <div className="category-skills">
              {category.skills.slice(0, 3).map(skill => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {bookingData.serviceCategory && (
        <div className="service-details">
          <h3>Service Details</h3>
          
          <div className="form-group">
            <label className="form-label">Service Type</label>
            <input
              type="text"
              className="form-input"
              placeholder="Describe your specific service need"
              value={bookingData.serviceType}
              onChange={e => updateBookingData('serviceType', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Duration</label>
            <div className="duration-options">
              {durationOptions.map(option => (
                <label key={option.value} className="duration-option">
                  <input
                    type="radio"
                    name="duration"
                    value={option.value}
                    checked={bookingData.duration === option.value}
                    onChange={e => updateBookingData('duration', e.target.value)}
                  />
                  <div className="duration-content">
                    <h4>{option.label}</h4>
                    <p>₹{serviceCategories[bookingData.serviceCategory]?.basePrice * option.multiplier}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {bookingData.duration === 'hourly' && (
            <div className="form-group">
              <label className="form-label">Number of Hours</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="24"
                value={bookingData.durationValue}
                onChange={e => updateBookingData('durationValue', parseInt(e.target.value))}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Special Requirements</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Any specific requirements or preferences?"
              value={bookingData.specialRequirements}
              onChange={e => updateBookingData('specialRequirements', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderLocationTime = () => (
    <div className="booking-step">
      <h2>Location & Time</h2>
      <p>Set your location and preferred time</p>
      
      <div className="form-group">
        <label className="form-label">Service Location *</label>
        <LeafletLocationPicker
          value={bookingData.location}
          onChange={handleLocationSelect}
          placeholder="Enter your address or location"
          showMap={true}
          height="200px"
        />
      </div>

    

<     div className="form-row">
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input
            type="date"
            className="form-input"
            min={new Date().toISOString().split('T')[0]}
            value={bookingData.date}
            onChange={e => updateBookingData('date', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Time Slot *</label>
          <select
            className="form-input"
            value={bookingData.timeSlot}
            onChange={e => updateBookingData('timeSlot', e.target.value)}
          >
            <option value="">Select a time</option>
            <option>Morning (6 AM - 12 PM)</option>
            <option>Afternoon (12 PM - 6 PM)</option>
            <option>Evening (6 PM - 10 PM)</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Urgency Level</label>
        <div className="urgency-options">
          {urgencyLevels.map(level => (
            <label key={level.value} className="urgency-option">
              <input
                type="radio"
                name="urgency"
                value={level.value}
                checked={bookingData.urgency === level.value}
                onChange={e => handleUrgencyChange(e.target.value)}
              />
              <div className="urgency-content">
                <h4 style={{ color: level.color }}>{level.label}</h4>
                <p>{level.multiplier}x pricing</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {bookingData.location && (
        <div className="location-preview">
          <h4>Location Preview</h4>
          <div className="map-placeholder">
            📍 {bookingData.location}
            <br />
            <small>Coordinates: {bookingData.coordinates.lat}, {bookingData.coordinates.lng}</small>
          </div>
        </div>
      )}
    </div>
  )


  
      const renderPricingOptions = () => (
        <div className="booking-step">
          <h2>Pricing & Additional Options</h2>
          <p>Review pricing and select additional services</p>
      
          {/* ---- PRICE BREAKDOWN ---- */}
          <div key={bookingData.totalPrice} className="pricing-breakdown">
            <h3>Price Breakdown</h3>

            <div className="price-item">
              <span>Base Price</span>
              <span>₹{bookingData.basePrice}</span>
            </div>

            {bookingData.urgency !== "normal" && (
              <div className="price-item urgency">
                <span>{urgencyLevels.find(u => u.value === bookingData.urgency)?.label} Service</span>
                <span>+₹{bookingData.urgencyExtra}</span>
              </div>
            )}

            <div className="price-item total">
              <span>Total</span>
              <span>₹{bookingData.totalPrice}</span>
            </div>
          </div>

      
         
      
          {/* ---- SELECTED WORKER (READ-ONLY) ---- */}
          <div className="selected-worker-summary">
            <h3>Selected Worker</h3>
      
            {bookingData.selectedWorker ? (
              <div className="worker-summary readonly">
                <div className="worker-avatar">
                  {bookingData.selectedWorker.userId?.name?.charAt(0) || "W"}
                </div>
      
                <div className="worker-info">
                  <h4>
                    {bookingData.selectedWorker.userId?.name ||
                      bookingData.selectedWorker.name ||
                      "Worker"}
                  </h4>
      
                  <p>{bookingData.selectedWorker.description || "Professional service provider"}</p>
      
                  <div className="worker-badges">
                    {bookingData.selectedWorker.verified && (
                      <span className="badge verified">✓ Verified</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-worker">
                <p>No worker selected. Please go back to Services.</p>
              </div>
            )}
          </div>
      
          {/* ---- NAVIGATION ---- */}
          {/* <div className="form-navigation">
            <button className="btn btn-outline" onClick={prevStep}>
              ← Previous
            </button>
      
            <button
              className="btn btn-primary"
              onClick={() => setCurrentStep(4)}
              disabled={!bookingData.selectedWorker}
            >
              Next →
            </button>
          </div> */}
        </div>
      );
      

      const renderConfirmation = () => (
        <div className="booking-step">
          <h2>Confirm Your Booking</h2>
          <p>Review all details before confirming</p>
      
          <div className="booking-summary">
            <div className="summary-section">
              <h3>Service Details</h3>
              <div className="summary-item">
                <span>Service:</span>
                <span>{serviceCategories[bookingData.serviceCategory]?.name}</span>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <span>{durationOptions.find(d => d.value === bookingData.duration)?.label}</span>
              </div>
              <div className="summary-item">
                <span>Date & Time:</span>
                <span>{bookingData.date} - {bookingData.timeSlot}</span>
              </div>
              <div className="summary-item">
                <span>Location:</span>
                <span>{bookingData.location}</span>
              </div>
            </div>
      
            <div className="summary-section">
              <h3>Worker Details</h3>
              {bookingData.selectedWorker && (
                <>
                  <div className="summary-item">
                    <span>Name:</span>
                    <span>{bookingData.selectedWorker.userId?.name}</span>
                  </div>
                  <div className="summary-item">
                    <span>Rating:</span>
                    <span>★ {bookingData.selectedWorker.rating || 0}</span>
                  </div>
                  <div className="summary-item">
                    {/* <span>Trust Score:</span>
                    <span>{bookingData.selectedWorker.trustScore || 0}%</span> */}
                  </div>
                </>
              )}
            </div>
      
            <div className="summary-section">
              <h3>Pricing</h3>
      
              <div className="summary-item">
                <span>Base Price:</span>
                <span>₹{bookingData.basePrice}</span>
              </div>
      
              {bookingData.urgency !== "normal" && (
                <div className="summary-item">
                  <span>Urgency Charge:</span>
                  <span>+₹{bookingData.urgencyExtra}</span>
                </div>
              )}
      
              <div className="summary-item total">
                <span>Total Amount:</span>
                <span>₹{bookingData.totalPrice}</span>
              </div>
            </div>
          </div>
      
          <div className="booking-actions">
            <button 
              className="btn btn-outline"
              onClick={prevStep}
            >
              ← Back
            </button>
            <button 
              className="btn btn-primary"
              onClick={createBooking}
              disabled={loading}
            >
              {loading ? 'Creating Booking...' : 'Confirm & Book Now'}
            </button>
          </div>
        </div>
      );
      
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderServiceDetails()
      case 2: return renderLocationTime()
      case 3: return renderPricingOptions()
      case 4: return renderConfirmation()
      default: return renderServiceDetails()
    }
  }

  return (
    <div className="user-booking-container">
      <div className="booking-header">
        <h1>Book Your Service</h1>
        <p>Get professional services at your doorstep</p>
        
      </div>
      
      {renderStepIndicator()}
      
      <div className="booking-form-container">
        {renderCurrentStep()}
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-navigation">
          {currentStep > 1 && currentStep !== 2 && (
            <button 
              className="btn btn-outline"
              onClick={prevStep}
            >
              ← Previous
            </button>
          )}
          
          {currentStep < totalSteps && (
            <button 
              className="btn btn-primary"
              onClick={nextStep}
              disabled={!bookingData.serviceCategory || !bookingData.location}
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Worker Details Modal */}
      {showWorkerDetails && selectedWorkerDetails && (
        <div className="modal-overlay">
          <div className="modal-content worker-details-modal">
            <div className="modal-header">
              <h3>Worker Details</h3>
              <button 
                className="modal-close"
                onClick={() => setShowWorkerDetails(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="worker-details-content">
              <div className="worker-profile">
                <div className="worker-avatar-large">
                  {selectedWorkerDetails.userId?.name?.charAt(0) || 'W'}
                </div>
                <h4>{selectedWorkerDetails.userId?.name || 'Worker'}</h4>
                <p>{selectedWorkerDetails.description || 'Professional service provider'}</p>
              </div>
              
              <div className="worker-stats-detailed">
                <div className="stat-card">
                  <span className="stat-number">{selectedWorkerDetails.rating || 0}</span>
                  <span className="stat-label">Rating</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{selectedWorkerDetails.trustScore || 0}%</span>
                  <span className="stat-label">Trust Score</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{selectedWorkerDetails.completedBookings || 0}</span>
                  <span className="stat-label">Completed Jobs</span>
                </div>
              </div>
              
              <div className="worker-skills-detailed">
                <h4>Skills & Languages</h4>
                <div className="skills-grid">
                  {selectedWorkerDetails.languages?.map(lang => (
                    <span key={lang} className="skill-tag">{lang}</span>
                  ))}
                </div>
              </div>
              
              <div className="worker-actions-modal">
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowChat(true)}
                >
                  💬 Chat
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowVideoCall(true)}
                >
                  📹 Video Call
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => confirmWorker(selectedWorkerDetails)}
                >
                  Select This Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot Modal */}
      {showAIChatbot && (
        <div className="modal-overlay">
          <div className="modal-content chatbot-modal">
            <div className="modal-header">
              <h3>AI Assistant</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAIChatbot(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="chatbot-content">
              <div className="chatbot-messages">
                <div className="message bot">
                  <p>Hello! I'm your AI assistant. How can I help you with your booking today?</p>
                </div>
              </div>
              
              <div className="chatbot-input">
                <input
                  type="text"
                  placeholder="Ask me anything about booking..."
                  className="chatbot-input-field"
                />
                <button className="btn btn-primary">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Modal */}
      {showChat && (
        <div className="modal-overlay">
          <div className="modal-content chat-modal">
            <div className="modal-header">
              <h3>Live Chat Support</h3>
              <button 
                className="modal-close"
                onClick={() => setShowChat(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="chat-content">
              <div className="chat-messages">
                <div className="message support">
                  <p>Welcome to our live chat! A support agent will be with you shortly.</p>
                </div>
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="chat-input-field"
                />
                <button className="btn btn-primary">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && (
        <div className="modal-overlay">
          <div className="modal-content video-modal">
            <div className="modal-header">
              <h3>Video Call</h3>
              <button 
                className="modal-close"
                onClick={() => setShowVideoCall(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="video-content">
              <div className="video-placeholder">
                📹 Video call feature coming soon!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
