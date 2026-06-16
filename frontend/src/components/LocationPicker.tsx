import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, X, LocateFixed, Map, Loader2, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationData {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  placeName?: string;
}

interface LocationPickerProps {
  onLocationSelect: (data: LocationData) => void;
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
  initialZip?: string;
}

interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
    label?: string;
    district?: string;
    locality?: string;
    county?: string;
    [key: string]: string | number | undefined;
  };
}

interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

interface SearchResult {
  id: number;
  displayName: string;
  shortName: string;
  detail: string;
  lat: number;
  lng: number;
  photonProps?: PhotonFeature['properties'];
}

const defaultCenter: [number, number] = [40.7128, -74.006];

// Check if text contains only Latin characters (English/European script)
const isLatinText = (text: string): boolean => {
  // Allow Latin letters (including accented), digits, spaces, and common punctuation
  // Reject Cyrillic, CJK, Arabic, Greek, Hebrew, Thai, etc.
  const nonLatinRegex = /[^\u0000-\u007F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u2000-\u206F\u2190-\u21FF\u2E00-\u2E7F]/;
  return !nonLatinRegex.test(text);
};

function splitDisplayName(fullName: string): { short: string; detail: string } {
  const parts = fullName.split(',').map((p) => p.trim());
  if (parts.length <= 2) {
    return { short: fullName, detail: '' };
  }
  return {
    short: parts.slice(0, 2).join(', '),
    detail: parts.slice(2).join(', '),
  };
}

export default function LocationPicker({
  onLocationSelect,
  initialAddress = '',
  initialCity = '',
  initialState = '',
  initialZip = '',
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Leaflet map
  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(defaultCenter, 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
      await reverseGeocode(lat, lng);
    });
  }, []);

  useEffect(() => {
    if (showMap) {
      const timer = setTimeout(() => {
        if (!mapInstanceRef.current) {
          initMap();
        } else {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showMap, initMap]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const placeMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:#6366f1;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      markerRef.current = L.marker([lat, lng], { icon: markerIcon }).addTo(mapInstanceRef.current);
    }

    mapInstanceRef.current.setView([lat, lng], 15);
  };

  const buildLabel = (props: PhotonFeature['properties']): string => {
    const parts = [
      props.name || [props.housenumber, props.street].filter(Boolean).join(' '),
      props.city || props.locality || props.district,
      props.state || props.county,
      props.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const propsToLocationData = (props: PhotonFeature['properties'], lat: number, lng: number): LocationData => {
    const street = [props.housenumber, props.street].filter(Boolean).join(' ');
    return {
      address: street,
      city: props.city || props.locality || '',
      state: props.state || props.county || '',
      zip: props.postcode || '',
      lat,
      lng,
      placeName: props.name || props.street || props.city || '',
    };
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`
      );
      const data: PhotonResponse = await res.json();
      const feature = data.features?.[0];
      if (feature) {
        const label = buildLabel(feature.properties);
        const locationData = propsToLocationData(feature.properties, lat, lng);
        setSelectedAddress(label);
        setSearchQuery(label);
        onLocationSelect(locationData);
      }
    } catch {
      console.error('Reverse geocoding failed');
    }
  };

  const performSearch = useCallback(async (query: string) => {
    // Cancel any pending request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setHasSearched(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearching(true);
    setSearchError('');
    setHasSearched(true);

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lang=en&limit=8`,
        { signal: controller.signal }
      );
      const data: PhotonResponse = await res.json();
      const mapped: SearchResult[] = data.features
        .filter((f) => {
          const label = buildLabel(f.properties);
          return label && isLatinText(label);
        })
        .map((f, index) => {
          const label = buildLabel(f.properties);
          const { short, detail } = splitDisplayName(label);
          const [lng, lat] = f.geometry.coordinates;
          return {
            id: index + 1,
            displayName: label,
            shortName: short,
            detail,
            lat,
            lng,
            photonProps: f.properties,
          };
        });
      setSearchResults(mapped);
      setShowResults(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSearchError('Search failed. Please try again.');
        setSearchResults([]);
        setShowResults(true);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Clear previous results immediately for responsiveness
    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setHasSearched(false);
      setSearchError('');
      return;
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const selectSearchResult = (result: SearchResult) => {
    setIsSelecting(true);
    setSearchQuery(result.displayName);
    setShowResults(false);
    setSelectedAddress(result.displayName);
    setShowMap(true);

    // Use the search result properties directly (no need for reverse geocode)
    if (result.photonProps) {
      const locationData = propsToLocationData(result.photonProps, result.lat, result.lng);
      onLocationSelect(locationData);
    } else {
      onLocationSelect({
        address: '',
        city: '',
        state: '',
        zip: '',
        lat: result.lat,
        lng: result.lng,
        placeName: result.displayName.split(',')[0],
      });
    }

    // Place marker after map initializes
    setTimeout(() => {
      placeMarker(result.lat, result.lng);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([result.lat, result.lng], 15);
      }
      setIsSelecting(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0 && showResults) {
      e.preventDefault();
      selectSearchResult(searchResults[0]);
    }
    if (e.key === 'Escape') {
      setShowResults(false);
      searchInputRef.current?.blur();
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setShowMap(true);
        setTimeout(() => {
          placeMarker(latitude, longitude);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 15);
          }
        }, 200);
        await reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearSelection = () => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setSelectedAddress('');
    setSearchQuery('');
    setShowMap(false);
    setSearchResults([]);
    setShowResults(false);
    setHasSearched(false);
    setSearchError('');
  };

  const showDropdown = showResults && (searchResults.length > 0 || searchError || (hasSearched && !searching));

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0 || searchError) {
                setShowResults(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search for a venue or address (English only)..."
            className="w-full px-4 py-3 pl-11 pr-10 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          {/* Loading spinner */}
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            </div>
          )}
          {/* Clear button */}
          {!searching && (searchQuery || selectedAddress) && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                clearSelection();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {/* Search Results Dropdown */}
          {showDropdown && (
            <div ref={dropdownRef} className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-72 overflow-y-auto">
              {searching && searchResults.length === 0 && (
                <div className="px-4 py-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching locations...
                </div>
              )}
              {!searching && searchError && (
                <div className="px-4 py-4 text-center text-sm text-red-600 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {searchError}
                </div>
              )}
              {!searching && !searchError && hasSearched && searchResults.length === 0 && (
                <div className="px-4 py-4 text-center text-sm text-gray-500">
                  No locations found. Try a different search term.
                </div>
              )}
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSearchResult(result);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 active:bg-indigo-100 text-sm text-gray-700 border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{result.shortName}</div>
                    {result.detail && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">{result.detail}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 text-sm font-medium"
          title="Use my current location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Map Preview */}
      {showMap && (
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full rounded-lg border border-gray-300"
            style={{ height: '350px' }}
          />
          {selectedAddress && (
            <div className="mt-2 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">{selectedAddress}</p>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      {!showMap && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Map className="w-4 h-4" />
          <span>Search for a location, use the pin icon for GPS, or click the map to pinpoint a spot.</span>
        </div>
      )}
    </div>
  );
}