import { useState, useEffect } from 'react'

const FallbackNavigation = ({ 
  address, 
  clientName, 
  serviceType, 
  coordinates = null 
}) => {
  const [userLocation, setUserLocation] = useState(null)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Could not get user location:', error)
        }
      )
    }
  }, [])

  const handleNavigate = () => {
    if (!address) return

    let mapsUrl
    let destination = address

    // Use exact coordinates if available
    if (coordinates && coordinates.lat && coordinates.lng) {
      destination = `${coordinates.lat},${coordinates.lng}`
    }

    if (userLocation) {
      // Use current location as origin with exact coordinates
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}&travelmode=driving&dir_action=navigate`
    } else {
      // Fallback to destination only
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`
    }
    
    // Open in new tab with proper parameters
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fallback-navigation" style={{
      padding: '1rem',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
          {clientName} - {serviceType}
        </h4>
        <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
          {address}
        </p>
        {coordinates && (
          <p style={{ margin: '0 0 1rem 0', color: '#9ca3af', fontSize: '0.75rem' }}>
            📍 Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
        )}
      </div>
      
      <button
        onClick={handleNavigate}
        style={{
          background: '#4285F4',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#3367D6'
          e.target.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#4285F4'
          e.target.style.transform = 'translateY(0)'
        }}
      >
        📍 Navigate to {clientName}
      </button>
      
      <p style={{ 
        margin: '0.75rem 0 0 0', 
        color: '#6b7280', 
        fontSize: '0.75rem' 
      }}>
        Opens Google Maps with turn-by-turn directions
      </p>
    </div>
  )
}

export default FallbackNavigation
