import { useState, useEffect, useRef } from 'react'

const LocationPicker = ({ 
  value, 
  onChange, 
  placeholder = "Enter your address or location",
  showMap = true,
  height = "200px"
}) => {
  const [location, setLocation] = useState(value || '')
  const [coordinates, setCoordinates] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    setLocation(value || '')
  }, [value])

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
          setError('Google Maps failed to load. Using fallback mode.')
          setMapError(true)
        }
      }
      script.onerror = () => {
        setError('Failed to load Google Maps. Using fallback mode.')
        setMapError(true)
      }
      
      document.head.appendChild(script)
    }

    if (showMap) {
      loadGoogleMaps()
    }
  }, [showMap])

  const initMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) {
      return
    }

    try {
      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 19.0760, lng: 72.8777 }, // Default to Mumbai
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy'
      })

      // Create autocomplete input
      const input = document.createElement('input')
      input.type = 'text'
      input.placeholder = placeholder
      input.value = location
      input.style.cssText = `
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 10px;
      `

      // Create autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(input)
      autocomplete.bindTo('bounds', map)

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.geometry || !place.geometry.location) {
          setError('Please select a valid location from the dropdown')
          return
        }

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address

        setLocation(address)
        setCoordinates({ lat, lng })
        setError('')

        // Update parent component
        onChange(address, { lat, lng })

        // Update map
        map.setCenter({ lat, lng })
        map.setZoom(15)

        // Add marker
        new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: address
        })
      })

      // Handle map click
      map.addListener('click', (event) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address
            setLocation(address)
            setCoordinates({ lat, lng })
            setError('')

            // Update parent component
            onChange(address, { lat, lng })

            // Update input value
            input.value = address

            // Add marker
            new window.google.maps.Marker({
              position: { lat, lng },
              map: map,
              title: address
            })
          }
        })
      })

      // Store autocomplete reference
      autocompleteRef.current = autocomplete

      setMapLoaded(true)
    } catch (error) {
      console.error('Map initialization failed:', error)
      setError('Failed to initialize map')
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        setCoordinates({ lat, lng })

        // Reverse geocode to get address
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address
              setLocation(address)
              onChange(address, { lat, lng })
            } else {
              setLocation(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
              onChange(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { lat, lng })
            }
            setIsLoading(false)
          })
        } else {
          setLocation(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
          onChange(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { lat, lng })
          setIsLoading(false)
        }
      },
      (error) => {
        setError('Could not get your current location. Please enter your address manually.')
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  return (
    <div className="location-picker">
      <div className="location-input-group">
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={location}
          onChange={(e) => {
            setLocation(e.target.value)
            onChange(e.target.value, coordinates)
          }}
        />
        <button 
          type="button"
          className="btn btn-outline"
          onClick={getCurrentLocation}
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '📍'} Current Location
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginTop: '0.5rem', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {showMap && (
        <div className="location-map" style={{ marginTop: '1rem' }}>
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
        </div>
      )}

      {coordinates && (
        <div className="location-coordinates" style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.875rem', 
          color: '#666' 
        }}>
          📍 Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </div>
      )}
    </div>
  )
}

export default LocationPicker
