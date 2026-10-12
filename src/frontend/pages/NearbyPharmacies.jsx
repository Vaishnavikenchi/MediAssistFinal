import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, CheckCircle, XCircle, Loader, Store, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { solapurShops } from '../data/solapurShops';
import { calculateDistance } from '../utils/calculateDistance';

export default function NearbyPharmacies() {
  const [query, setQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const [mapObj, setMapObj] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Map
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const initMap = () => {
      if (ignore) return;
      if (window.google && window.google.maps) {
        const defaultLoc = { lat: 40.7128, lng: -74.0060 }; // Default fallback
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
          center: defaultLoc,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
          ]
        });
        setMapObj(map);
      } else {
        setTimeout(initMap, 1000);
      }
    };
    initMap();
    return () => { ignore = true; };
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    const loadingToast = toast.loading('Fetching location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        toast.dismiss(loadingToast);
        toast.success('Location acquired!');
        
        if (mapObj) {
          mapObj.setCenter(loc);
          mapObj.setZoom(14);
          new window.google.maps.Marker({
            position: loc,
            map: mapObj,
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            title: 'Your Location'
          });
        }
      },
      () => {
        toast.dismiss(loadingToast);
        toast.error('Unable to retrieve your location');
      }
    );
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (isOffline) {
      toast.error('Nearby stores not available offline');
      return;
    }
    if (!userLocation && !manualLocation) {
      toast.error('Please enable location to see nearby stores');
      return;
    }
    if (!query.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }

    setLoading(true);
    try {
      let url = `http://localhost:8080/api/search/pharmacies?medicine=${encodeURIComponent(query)}`;
      if (userLocation) {
        url += `&lat=${userLocation.lat}&lon=${userLocation.lng}`;
      } else if (manualLocation) {
        url += `&city=${encodeURIComponent(manualLocation)}`;
      }
      if (inStockOnly) {
        url += `&inStockOnly=true`;
      }

      let data;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch from backend');
        data = await res.json();
      } catch (err) {
        toast('Backend unavailable. Using Solapur dummy data.', { icon: 'ℹ️' });
        const userLat = userLocation ? userLocation.lat : 17.6599; // Default Solapur center
        const userLng = userLocation ? userLocation.lng : 75.9064;
  
        data = solapurShops.map((shop) => {
          // Check if searched medicine exists in shop's available medicines
          const isAvailable = shop.availableMedicines.some(med => 
             med.toLowerCase().includes(query.toLowerCase())
          );
          
          const dist = calculateDistance(userLat, userLng, shop.latitude, shop.longitude);
          
          return {
             ...shop,
             inStock: isAvailable,
             distance: dist
          };
        });
        
        // Sort shops by nearest distance (ascending order)
        data.sort((a, b) => a.distance - b.distance);
        
        // If inStockOnly is checked, filter them
        if (inStockOnly) {
          data = data.filter(d => d.inStock);
        }
      }
      
      setResults(data);
      
      if (data.length === 0) {
        toast('No pharmacies found with this medicine.', { icon: '🔍' });
      }

      // Update map markers
      if (mapObj) {
        clearMarkers();
        const bounds = new window.google.maps.LatLngBounds();
        if (userLocation) bounds.extend(userLocation);

        data.forEach(pharmacy => {
          if (pharmacy.latitude && pharmacy.longitude) {
            const pos = { lat: pharmacy.latitude, lng: pharmacy.longitude };
            const marker = new window.google.maps.Marker({
              position: pos,
              map: mapObj,
              title: pharmacy.pharmacyName,
              icon: pharmacy.inStock 
                ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' 
                : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 5px; color: #333; min-width: 150px;">
                  <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${pharmacy.pharmacyName}</strong>
                  <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${pharmacy.address}</p>
                  ${pharmacy.contactNumber ? `<p style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold; color: #555;">📞 ${pharmacy.contactNumber}</p>` : ''}
                  <span style="font-weight: bold; font-size: 12px; color: ${pharmacy.inStock ? '#10b981' : '#ef4444'}">
                    ${pharmacy.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(mapObj, marker);
            });

            markersRef.current.push(marker);
            bounds.extend(pos);
          }
        });

        if (!bounds.isEmpty()) {
          mapObj.fitBounds(bounds);
          if (mapObj.getZoom() > 15) mapObj.setZoom(15);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 h-full flex flex-col">
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Nearby Shops</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium flex items-center gap-2">
            Find pharmacies stocking your medicine
          </p>
        </div>
      </div>

      <div className="premium-glass rounded-3xl p-5 md:p-6 flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <form onSubmit={handleSearch} className="relative z-10 flex flex-col gap-4">
          <div className="flex-1 flex gap-3 flex-col sm:flex-row">
            <div className="relative w-full sm:w-1/2 group">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Medicine name (e.g. Paracetamol)"
                className="input-premium pl-12 py-3 w-full shadow-inner bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm"
              />
            </div>
            
            <div className="flex flex-1 gap-2 flex-col sm:flex-row">
              <div className="relative flex-1 group">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="City name (or use button)"
                  className="input-premium pl-12 py-3 w-full shadow-inner bg-[var(--bg-secondary)] focus:bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                className="btn-premium flex-shrink-0 !bg-[var(--bg-secondary)] !text-[var(--text-primary)] hover:!bg-indigo-500/10 hover:!text-indigo-500 border border-[var(--border-color)] hover:!border-indigo-500/50 py-3 px-4 flex items-center justify-center gap-2 transition-colors"
                title="Detect My Location"
              >
                <Navigation className={`w-4 h-4 ${userLocation ? 'text-indigo-500' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-[var(--bg-secondary)] border-[var(--border-color)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors">In Stock Only</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex flex-items-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span>Find</span>
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Results List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
          {results.length === 0 && !loading && (
             <div className="h-full min-h-[200px] flex items-center justify-center premium-glass rounded-3xl border-dashed border-2 border-[var(--glass-border)] flex-col gap-3 p-6 text-center">
               <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center ring-1 ring-[var(--border-color)]">
                 <Store className="w-6 h-6 text-[var(--text-secondary)] opacity-50" />
               </div>
               <p className="text-[var(--text-secondary)] text-sm font-medium">Search to find pharmacies with your medicine.</p>
             </div>
          )}
          {loading && (
            <div className="h-full flex items-center justify-center min-h-[200px]">
              <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          )}
          {!loading && results.length > 0 && results.every(shop => !shop.inStock) && (
            <div className="premium-glass p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center gap-3 animate-fade-in flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-500">Medicine not available nearby.</p>
            </div>
          )}
          {!loading && results.map((shop, i) => (
             <div key={i} className={`premium-glass p-5 rounded-2xl flex flex-col gap-3 hover:border-indigo-500/30 transition-colors group relative overflow-hidden animate-fade-in flex-shrink-0 ${i === 0 ? 'ring-2 ring-indigo-500/50' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${shop.inStock ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
               <div className="pl-2">
                 <div className="flex justify-between items-start mb-1 gap-2">
                   <h3 className="font-bold text-[var(--text-primary)] text-lg pr-2 leading-tight">{shop.pharmacyName}</h3>
                   {i === 0 && (
                     <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap mt-1">Nearest</span>
                   )}
                 </div>
                 <p className="text-xs text-[var(--text-secondary)] mb-2 leading-relaxed">{shop.address}</p>
                 
                 {shop.contactNumber && (
                   <div className="flex items-center gap-1.5 mb-2 mt-1">
                     <Phone className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                     <span className="text-xs text-[var(--text-primary)] font-medium">{shop.contactNumber}</span>
                   </div>
                 )}
                 
                 <div className="grid grid-cols-2 gap-y-2 gap-x-1 mt-3 pt-3 border-t border-[var(--border-color)]">
                    {shop.distance != null && (
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[var(--text-secondary)]">{shop.distance.toFixed(1)} km</span>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1.5 text-xs font-medium">
                      {shop.inStock ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span className={shop.inStock ? 'text-emerald-500' : 'text-red-500'}>{shop.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                 </div>
                 
                 <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation ? userLocation.lat : 17.6599},${userLocation ? userLocation.lng : 75.9064}&destination=${shop.latitude},${shop.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-indigo-500/10 text-[var(--text-primary)] hover:text-indigo-500 font-medium text-xs transition-colors ring-1 ring-[var(--border-color)]"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Get Directions
                    </a>
                 </div>
               </div>
             </div>
          ))}
        </div>

        {/* Map View */}
        <div className="w-full lg:w-2/3 h-[400px] lg:h-auto min-h-[400px] premium-glass rounded-3xl overflow-hidden relative border border-[var(--border-color)] shadow-inner">
           {isOffline ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-secondary)] z-20 text-[var(--text-secondary)] font-medium p-6 text-center">
                <div className="p-4 bg-[var(--bg-primary)] rounded-full mb-4 ring-1 ring-[var(--border-color)]">
                  <span className="text-2xl">📡</span>
                </div>
                <p>Nearby stores not available offline</p>
              </div>
           ) : (!userLocation && !manualLocation) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-secondary)] z-20 text-[var(--text-secondary)] font-medium p-6 text-center">
                <Navigation className="w-10 h-10 mb-3 opacity-50" />
                <p>Please enable location to see nearby stores</p>
                <button onClick={handleGetLocation} className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 font-bold transition-colors">Enable Location</button>
              </div>
           ) : !mapObj && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)] z-20">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
           )}
           <div ref={mapRef} className="w-full h-full custom-map-style" />
        </div>
      </div>
    </div>
  );
}
