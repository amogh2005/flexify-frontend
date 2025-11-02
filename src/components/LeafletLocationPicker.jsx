import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const LeafletLocationPicker = ({ 
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
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]) // Default to Mumbai
  const [markerPosition, setMarkerPosition] = useState(null)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    setLocation(value || '')
  }, [value])

  // Initialize Leaflet map
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current) {
      try {
        // Fix for default markers
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Create map
        const map = L.map(mapRef.current).setView(mapCenter, 13)

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        // Store map instance
        mapInstanceRef.current = map

        // Add click event to map
        map.on('click', async (e) => {
          const lat = e.latlng.lat
          const lng = e.latlng.lng
          
          setCoordinates({ lat, lng })
          setMarkerPosition([lat, lng])

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current)
          }

          // Add new marker
          const marker = L.marker([lat, lng]).addTo(map)
          markerRef.current = marker

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            )
            const data = await response.json()
            
            if (data && data.display_name) {
              setLocation(data.display_name)
              onChange(data.display_name, { lat, lng })
            } else {
              setLocation(`Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`)
              onChange(`Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`, { lat, lng })
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error)
            setLocation(`Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`)
            onChange(`Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`, { lat, lng })
          }
        })

        setMapLoaded(true)
      } catch (error) {
        console.error('Map initialization failed:', error)
        setError('Failed to initialize map')
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [showMap, mapCenter])

  const geocodeAddress = async (address) => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        const address = data[0].display_name
        
        setCoordinates({ lat, lng })
        setLocation(address)
        onChange(address, { lat, lng })

        // Update map if it's loaded
        if (mapInstanceRef.current) {
          const map = mapInstanceRef.current
          
          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current)
          }

          // Add new marker
          const marker = L.marker([lat, lng]).addTo(map)
          markerRef.current = marker

          // Center map on new location
          map.setView([lat, lng], 15)
        }
      } else {
        setError('Address not found. Please try a different address.')
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
      setError('Failed to find location. Please try again.')
    } finally {
      setIsLoading(false)
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

        // Update map if it's loaded
        if (mapInstanceRef.current) {
          const map = mapInstanceRef.current
          
          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current)
          }

          // Add new marker
          const marker = L.marker([lat, lng]).addTo(map)
          markerRef.current = marker

          // Center map on current location
          map.setView([lat, lng], 15)
        }

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          )
          const data = await response.json()
          
          if (data && data.display_name) {
            setLocation(data.display_name)
            onChange(data.display_name, { lat, lng })
          } else {
            setLocation(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
            onChange(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { lat, lng })
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error)
          setLocation(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
          onChange(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, { lat, lng })
        }
        
        setIsLoading(false)
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

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    if (location.trim()) {
      geocodeAddress(location.trim())
    }
  }

  return (
    <div className="leaflet-location-picker">
      <div className="location-input-group">
        <form onSubmit={handleAddressSubmit}>
          <input
            type="text"
            className="form-input"
            placeholder={placeholder}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </form>
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
          <div style={{ 
            width: '100%', 
            height,
            borderRadius: '4px',
            border: '1px solid #ddd',
            position: 'relative'
          }}>
            <div 
              ref={mapRef} 
              style={{ 
                width: '100%', 
                height: '100%',
                borderRadius: '4px'
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
                  <div>Loading interactive map...</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#666' }}>
                    Click anywhere on the map to select location
                  </div>
                </div>
              </div>
            )}

            {mapLoaded && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255,255,255,0.9)',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#666',
                border: '1px solid #ddd'
              }}>
                Click on map to select location
              </div>
            )}
          </div>
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

export default LeafletLocationPicker
