import { useEffect, useRef, useState } from 'react'
import FallbackNavigation from './FallbackNavigation'

const GoogleMap = ({ 
  address, 
  clientName, 
  serviceType, 
  className = '', 
  height = '200px',
  showNavigateButton = true,
  coordinates = null
}) => {
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [userLocation, setUserLocation] = useState(null)

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

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBrVvqwPBVzzuUecBE2W0SWOfnljAwT0UY'}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        // Check if Google Maps loaded successfully
        if (window.google && window.google.maps) {
          initMap()
        } else {
          setMapError(true)
        }
      }
      script.onerror = () => setMapError(true)
      
      document.head.appendChild(script)
    }

    if (address) {
      loadGoogleMaps()
    }
  }, [address])

  const initMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current || !address) {
      return
    }

    try {
      // Create geocoder to get coordinates from address
      const geocoder = new window.google.maps.Geocoder()
      
      // Use exact coordinates if available, otherwise geocode the address
      let location
      if (coordinates && coordinates.lat && coordinates.lng) {
        location = new window.google.maps.LatLng(coordinates.lat, coordinates.lng)
      } else {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location
            initMapWithLocation(location)
          } else {
            console.error('Geocoding failed:', status)
            setMapError(true)
          }
        })
        return
      }

      initMapWithLocation(location)
    } catch (error) {
      console.error('Map initialization failed:', error)
      setMapError(true)
    }
  }

  const initMapWithLocation = (location) => {
    if (!window.google || !window.google.maps || !mapRef.current || !location) {
      return
    }

    try {
      // Create map with mobile-optimized settings
      const map = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM
        },
        gestureHandling: 'greedy', // Better touch handling for mobile
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      // Create custom marker with tooltip
      const marker = new window.google.maps.Marker({
        position: location,
        map: map,
        title: `${clientName} - ${serviceType}`,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" stroke="#fff" stroke-width="2" d="M16 2C9.373 2 4 7.373 4 14c0 8 12 22 12 22s12-14 12-22c0-6.627-5.373-12-12-12z"/>
              <circle fill="#fff" cx="16" cy="14" r="6"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 40),
          anchor: new window.google.maps.Point(16, 40)
        }
      })

      // Create info window for tooltip
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: Arial, sans-serif; max-width: 200px;">
            <h4 style="margin: 0 0 4px 0; color: #333; font-size: 14px;">${clientName}</h4>
            <p style="margin: 0; color: #666; font-size: 12px;">${serviceType}</p>
            <p style="margin: 4px 0 0 0; color: #888; font-size: 11px;">${address}</p>
          </div>
        `
      })

      // Show tooltip on marker hover
      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker)
      })

      // Hide tooltip when mouse leaves marker
      marker.addListener('mouseout', () => {
        infoWindow.close()
      })

      // Add click listener to marker to show permanent info
      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      // Set map cursor styles (desktop only)
      if (!('ontouchstart' in window)) {
        map.addListener('mouseover', () => {
          mapRef.current.style.cursor = 'grab'
        })

        map.addListener('mouseout', () => {
          mapRef.current.style.cursor = 'default'
        })

        map.addListener('mousedown', () => {
          mapRef.current.style.cursor = 'grabbing'
        })

        map.addListener('mouseup', () => {
          mapRef.current.style.cursor = 'grab'
        })
      }

      setMapLoaded(true)
    } catch (error) {
      console.error('Map initialization failed:', error)
      setMapError(true)
    }
  }

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

  if (!address) {
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

  if (mapError) {
    return (
      <div className={`map-error ${className}`} style={{ height }}>
        <FallbackNavigation
          address={address}
          clientName={clientName}
          serviceType={serviceType}
          coordinates={coordinates}
        />
      </div>
    )
  }

  return (
    <div className={`google-map-container ${className}`}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height,
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}
      />
      
      {!mapLoaded && (
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

export default GoogleMap
