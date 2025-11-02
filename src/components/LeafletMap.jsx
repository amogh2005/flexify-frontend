import { useEffect, useState } from 'react'

const LeafletMap = ({ 
  address, 
  clientName, 
  serviceType, 
  className = '', 
  height = '200px',
  showNavigateButton = true,
  coordinates = null
}) => {
  const [userLocation, setUserLocation] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Get user's current location for navigation
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

  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleNavigate = () => {
    if (!address && !coordinates) return

    let destination = address

    // Use exact coordinates if available
    if (coordinates && coordinates.lat && coordinates.lng) {
      destination = `${coordinates.lat},${coordinates.lng}`
    }

    let mapsUrl
    if (userLocation) {
      // Use current location as origin
      mapsUrl = `https://www.openstreetmap.org/directions?engine=osrm_car&route=${userLocation.lat},${userLocation.lng};${destination}`
    } else {
      // Fallback to destination only
      mapsUrl = `https://www.openstreetmap.org/directions?engine=osrm_car&route=${destination}`
    }
    
    // Open in new tab
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  if (!address && !coordinates) {
    return (
      <div className={`map-placeholder ${className}`} style={{ height }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          color: '#666'
        }}>
          No address provided
        </div>
      </div>
    )
  }

  return (
    <div className={`leaflet-map-container ${className}`}>
      <div style={{ 
        width: '100%', 
        height,
        borderRadius: '4px',
        border: '1px solid #ddd',
        backgroundColor: '#f8f9fa',
        position: 'relative'
      }}>
        {mapLoaded ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            textAlign: 'center'
          }}>
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
            <div style={{
              background: '#e5e7eb',
              borderRadius: '4px',
              padding: '0.5rem',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              Interactive map will be available here
            </div>
          </div>
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: '4px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗺️</div>
              <div>Loading map...</div>
            </div>
          </div>
        )}
      </div>

      {showNavigateButton && (
        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          <button
            onClick={handleNavigate}
            style={{
              background: '#4285F4',
              color: 'white',
              border: 'none',
              padding: window.innerWidth <= 768 ? '0.75rem 1rem' : '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: window.innerWidth <= 768 ? '0.875rem' : '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: window.innerWidth <= 768 ? '100%' : 'auto',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.target.style.background = '#3367D6'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                e.target.style.background = '#4285F4'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            📍 Navigate to {clientName}
          </button>
        </div>
      )}
    </div>
  )
}

export default LeafletMap
