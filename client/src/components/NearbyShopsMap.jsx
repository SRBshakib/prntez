import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Printer,
  Compass,
  Store,
  Clock,
  Sparkles,
  QrCode,
  UploadCloud,
  ChevronRight,
  Maximize2
} from 'lucide-react';

// Distance calculation using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d; // in km
}

export default function NearbyShopsMap({
  shops = [],
  selectedShop = null,
  onSelectShop = () => {},
  onPrintToShop = () => {},
  onViewQr = () => {},
  radius = 3, // km
  onRadiusChange = () => {}
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Center defaults to IUB / Bashundhara R/A (23.8151, 90.4255)
  const [center, setCenter] = useState({ lat: 23.8151, lng: 90.4255 });
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationName, setLocationName] = useState('Campus Center (IUB / Bashundhara)');
  const markersByIdRef = useRef({});

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true
    });

    // Clean CartoDB Voyager tiles with reliable fallback
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }
    ).addTo(map);

    // Zoom Control on bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Trigger multiple invalidation frames to ensure tiles render regardless of animation/layout timing
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Window resize handler for Leaflet
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Delegated click handler for popup buttons (prevents timing issues with Leaflet DOM)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      const printBtn = e.target.closest('[data-map-action="print"]');
      if (printBtn) {
        const shopId = parseInt(printBtn.getAttribute('data-shop-id'), 10);
        const shop = shops.find((s) => s.id === shopId);
        if (shop) onPrintToShop(shop);
        return;
      }
      const qrBtn = e.target.closest('[data-map-action="qr"]');
      if (qrBtn) {
        const shopId = parseInt(qrBtn.getAttribute('data-shop-id'), 10);
        const shop = shops.find((s) => s.id === shopId);
        if (shop) onViewQr(shop);
        return;
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [shops, onPrintToShop, onViewQr]);

  // Update center & radius circle and fit bounds when radius changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentCenter = userLocation || center;

    // Draw / update radius circle
    if (circleRef.current) {
      circleRef.current.remove();
    }

    const radiusMeters = radius * 1000;
    const circle = L.circle([currentCenter.lat, currentCenter.lng], {
      radius: radiusMeters,
      color: '#2563eb',
      weight: 2,
      dashArray: '6, 8',
      fillColor: '#3b82f6',
      fillOpacity: 0.08
    }).addTo(map);

    circleRef.current = circle;

    // Smoothly adjust view to contain radius circle
    map.fitBounds(circle.getBounds(), { padding: [30, 30], maxZoom: 16 });

    // Update user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userHtml = `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></span>
        <span class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
      </div>
    `;

    userMarkerRef.current = L.marker([currentCenter.lat, currentCenter.lng], {
      icon: L.divIcon({
        className: 'user-pin-icon',
        html: userHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      }),
      zIndexOffset: 1000
    }).addTo(map);

    userMarkerRef.current.bindTooltip(
      `<div class="text-xs font-bold text-slate-800">You Are Here</div>`,
      { direction: 'top', offset: [0, -10] }
    );
  }, [center, userLocation, radius]);

  // Update shop markers whenever shops, radius, or userLocation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markersByIdRef.current = {};

    const currentCenter = userLocation || center;

    shops.forEach((shop, index) => {
      let lat = parseFloat(shop.latitude || 23.8151);
      let lng = parseFloat(shop.longitude || 90.4255);
      if (isNaN(lat) || isNaN(lng)) return;

      // Jitter overlapping coordinates so multiple shops at same spot are distinctly visible
      const duplicateCount = shops.slice(0, index).filter((s) => {
        const sLat = parseFloat(s.latitude || 23.8151);
        const sLng = parseFloat(s.longitude || 90.4255);
        return Math.abs(sLat - lat) < 0.0001 && Math.abs(sLng - lng) < 0.0001;
      }).length;

      if (duplicateCount > 0) {
        const angle = duplicateCount * (Math.PI / 3);
        lat += Math.cos(angle) * 0.00045;
        lng += Math.sin(angle) * 0.00045;
      }

      const distKm = calculateDistance(currentCenter.lat, currentCenter.lng, lat, lng);
      const isWithinRadius = distKm === null || distKm <= radius;
      const isOpen = !shop.is_closed;
      const isSelected = selectedShop?.id === shop.id;

      // Custom HTML Marker using Tailwind classes
      const markerHtml = `
        <div class="group relative cursor-pointer flex flex-col items-center">
          ${
            isOpen
              ? `<div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>`
              : ''
          }
          <div class="px-2.5 py-1 rounded-xl shadow-lg border text-xs font-black flex items-center gap-1.5 transition-transform duration-200 transform group-hover:scale-110 ${
            isSelected
              ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/30'
              : isOpen
              ? 'bg-white text-slate-900 border-slate-200 hover:border-blue-400'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }">
            <svg class="w-3.5 h-3.5 ${isSelected ? 'text-white' : isOpen ? 'text-blue-600' : 'text-slate-400'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span class="truncate max-w-[90px]">${shop.name}</span>
            <span class="text-[10px] font-mono opacity-80">৳${parseFloat(shop.price_bw || 2).toFixed(0)}</span>
          </div>
          <div class="w-2 h-2 rotate-45 -mt-1 shadow ${isSelected ? 'bg-blue-600' : 'bg-white border-r border-b border-slate-200'}"></div>
        </div>
      `;

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: `shop-marker-${shop.id}`,
          html: markerHtml,
          iconSize: [120, 36],
          iconAnchor: [60, 36]
        }),
        opacity: isWithinRadius ? 1 : 0.35,
        zIndexOffset: isSelected ? 500 : 0
      });

      // Rich interactive Leaflet popup with data attributes
      const popupHtml = `
        <div class="p-1 min-w-[210px] text-left font-sans">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-xs font-black text-slate-900 truncate">${shop.name}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }">
              ${isOpen ? '● Open' : 'Closed'}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 mb-2 truncate">📍 ${shop.address || 'Campus Counter'}</p>
          
          <div class="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-50 rounded-lg text-[11px] mb-2.5">
            <div>
              <span class="text-slate-400 text-[10px]">B&W:</span>
              <span class="font-bold text-slate-800 ml-1">৳${parseFloat(shop.price_bw || 2).toFixed(2)}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px]">Color:</span>
              <span class="font-bold text-blue-600 ml-1">৳${parseFloat(shop.price_color || 10).toFixed(2)}</span>
            </div>
          </div>

          ${
            distKm !== null
              ? `<div class="text-[10px] text-slate-500 font-medium mb-2.5 flex items-center gap-1">
                   <span>🧭 Approx. <strong>${distKm < 1 ? Math.round(distKm * 1000) + ' m' : distKm.toFixed(1) + ' km'}</strong> away</span>
                 </div>`
              : ''
          }

          <div class="flex flex-col gap-1.5">
            <button
              type="button"
              data-map-action="print"
              data-shop-id="${shop.id}"
              class="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Print to This Shop</span>
              <span>→</span>
            </button>
            <button
              type="button"
              data-map-action="qr"
              data-shop-id="${shop.id}"
              class="w-full py-1 px-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View Counter QR</span>
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'prntez-custom-popup',
        maxWidth: 260
      });

      marker.on('popupopen', () => {
        onSelectShop(shop);
      });

      marker.on('click', () => {
        onSelectShop(shop);
      });

      markersGroup.addLayer(marker);
      markersByIdRef.current[shop.id] = marker;
    });
  }, [shops, radius, userLocation, center, selectedShop]);

  // Zoom and open popup when shop is selected from card list
  useEffect(() => {
    if (!selectedShop || !mapInstanceRef.current) return;
    const lat = parseFloat(selectedShop.latitude || 23.8151);
    const lng = parseFloat(selectedShop.longitude || 90.4255);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1 });
      setTimeout(() => {
        const marker = markersByIdRef.current[selectedShop.id];
        if (marker && !marker.isPopupOpen()) {
          marker.openPopup();
        }
      }, 500);
    }
  }, [selectedShop]);

  // Live geolocation trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setUserLocation(newLoc);
        setLocationName('Your Current GPS Location');
        setIsLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not retrieve your live location. Using campus center.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Reset to IUB Campus Center
  const handleResetToCampus = () => {
    const campusCenter = { lat: 23.8151, lng: 90.4255 };
    setUserLocation(null);
    setCenter(campusCenter);
    setLocationName('Campus Center (IUB / Bashundhara)');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([campusCenter.lat, campusCenter.lng], 15, { duration: 1 });
    }
  };

  const currentCenter = userLocation || center;
  const shopsInRadius = shops.filter((s) => {
    const d = calculateDistance(
      currentCenter.lat,
      currentCenter.lng,
      parseFloat(s.latitude || 23.8151),
      parseFloat(s.longitude || 90.4255)
    );
    return d === null || d <= radius;
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl overflow-hidden">
      {/* Map Control Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 tracking-tight">
                Live Campus Radar Map
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{shopsInRadius.length} In Radius</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
              Center: <span className="text-slate-800 font-semibold">{locationName}</span>
            </p>
          </div>
        </div>

        {/* Radius Selector Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>Radius:</span>
          </span>
          {[
            { label: '500m', val: 0.5 },
            { label: '1 km', val: 1 },
            { label: '3 km', val: 3 },
            { label: '5 km', val: 5 },
            { label: '10 km', val: 10 }
          ].map((r) => (
            <button
              key={r.val}
              type="button"
              onClick={() => onRadiusChange(r.val)}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all text-xs ${
                radius === r.val
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            title="Use My Current GPS Location"
          >
            <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'My Location'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetToCampus}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Reset Center to Campus"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>IUB Campus</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-[380px] sm:h-[440px] z-0 focus:outline-none"
          style={{ background: '#f8fafc' }}
        />

        {/* Map Legend Overlay */}
        <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-200 shadow-md text-[11px] font-medium text-slate-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Center Point</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Open Print Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-blue-500 border-dashed bg-blue-50"></span>
            <span>{radius} km Search Radius</span>
          </div>
        </div>

        {/* Click Instruction Banner */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur text-white px-3 py-1.5 rounded-xl shadow-lg text-[11px] font-bold flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Click any shop marker to see live rates & print instantly</span>
        </div>
      </div>
    </div>
  );
}
