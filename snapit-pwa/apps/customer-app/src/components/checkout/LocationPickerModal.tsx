import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Check, MapPin, Loader2, Sparkles } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: { lat: number; lng: number; addressHint?: string }) => void;
  initialCoords?: { lat: number; lng: number };
}

// Default KGF town center (Robertsonpet / Bowrilalpet)
const DEFAULT_KGF_COORDS = { lat: 12.9340, lng: 78.2680 };

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialCoords = DEFAULT_KGF_COORDS,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>(initialCoords);
  const [isLocating, setIsLocating] = useState(false);
  const [addressHint, setAddressHint] = useState<string>('KGF, Karnataka');
  const [isDragging, setIsDragging] = useState(false);

  // Initialize and tear down Leaflet map
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const startLat = initialCoords.lat || DEFAULT_KGF_COORDS.lat;
      const startLng = initialCoords.lng || DEFAULT_KGF_COORDS.lng;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [startLat, startLng],
          zoom: 17,
          zoomControl: false,
        });

        // Add standard zoom control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // OpenStreetMap Carto Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        map.on('movestart', () => {
          setIsDragging(true);
        });

        map.on('move', () => {
          const center = map.getCenter();
          setCurrentCoords({ lat: center.lat, lng: center.lng });
        });

        map.on('moveend', () => {
          setIsDragging(false);
          const center = map.getCenter();
          setCurrentCoords({ lat: center.lat, lng: center.lng });
          fetchAddressHint(center.lat, center.lng);
        });

        mapInstanceRef.current = map;
        setCurrentCoords({ lat: startLat, lng: startLng });
        fetchAddressHint(startLat, startLng);
      } else {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Reverse geocode hint for user feedback
  const fetchAddressHint = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'MinnitCustomerApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const road = data.address?.road || data.address?.neighbourhood || data.address?.suburb || 'KGF';
        const area = data.address?.city_district || data.address?.town || data.address?.county || 'Robertsonpet';
        setAddressHint(`${road}, ${area}`);
      }
    } catch {
      // Non-critical fallback
    }
  };

  // High-accuracy GPS locate handler
  const handleUseMyGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 18, { duration: 1.2 });
        }
        setCurrentCoords({ lat: latitude, lng: longitude });
        fetchAddressHint(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        console.warn('GPS location error:', error);
        alert('Could not fetch your GPS location. Please allow location permissions in your browser or drag the map manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLockLocation = () => {
    onConfirm({
      lat: Number(currentCoords.lat.toFixed(6)),
      lng: Number(currentCoords.lng.toFixed(6)),
      addressHint,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col h-[82vh] max-h-[640px]"
          >
            {/* ── Modal Header ── */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <span className="text-lg">🗺️</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-gray-900 leading-tight truncate">
                    Pin Exact Delivery Location
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                    Move the map to point to your exact house or gate
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Map Container with Fixed Center Pin ── */}
            <div className="relative flex-1 w-full overflow-hidden bg-gray-100">
              {/* Leaflet Mount Element */}
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Floating "Use My GPS" Button */}
              <div className="absolute top-3 right-3 z-[1000]">
                <button
                  type="button"
                  onClick={handleUseMyGps}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-black px-3.5 py-2 rounded-2xl shadow-lg border border-emerald-200 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                      <span>Locating...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      <span>Use My GPS</span>
                    </>
                  )}
                </button>
              </div>

              {/* ── Minnit Signature Center Pin (Fixed in center) ── */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
                <div className="relative flex flex-col items-center select-none" style={{ marginTop: '-42px' }}>
                  {/* Floating speech tooltip */}
                  <motion.div
                    animate={{ y: isDragging ? -10 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="mb-1 bg-gray-900/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md whitespace-nowrap flex items-center gap-1 backdrop-blur-xs"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>Drop Pin Here</span>
                  </motion.div>

                  {/* Minnit Emerald Marker Head & Needle */}
                  <motion.div
                    animate={{ scale: isDragging ? 1.15 : 1, y: isDragging ? -12 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="relative flex flex-col items-center filter drop-shadow-[0_8px_16px_rgba(5,150,105,0.45)]"
                  >
                    {/* Emerald circular badge */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 via-brand to-teal-500 p-0.5 flex items-center justify-center shadow-lg ring-4 ring-white">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-emerald-700 fill-emerald-600" />
                      </div>
                    </div>
                    {/* Needle tip */}
                    <div
                      className="w-0 h-0 -mt-1 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-emerald-700"
                    />
                  </motion.div>

                  {/* Target shadow pulse on map floor */}
                  <motion.div
                    animate={{
                      scale: isDragging ? 0.6 : 1,
                      opacity: isDragging ? 0.4 : 0.8,
                    }}
                    className="w-5 h-2 bg-emerald-950/40 rounded-full blur-[1.5px] mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* ── Modal Footer ── */}
            <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3 z-20 shrink-0">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-xs font-black text-emerald-900 truncate">
                    {addressHint || 'Direct Doorstep Pinpoint'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 shrink-0">
                  {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLockLocation}
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-600 via-brand to-teal-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(5,150,105,0.35)] hover:shadow-[0_10px_30px_rgba(5,150,105,0.45)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Lock Doorstep Location Here</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};