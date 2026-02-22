import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function MapPicker({ isOpen, onClose, onConfirm, initialLat, initialLng, initialAddress }) {
  const [position, setPosition] = useState({ lat: initialLat || 41.2995, lng: initialLng || 69.2401 });
  const [address, setAddress] = useState(initialAddress || '');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!token) return;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=ru`);
      const data = await res.json();
      if (data.features?.length) setAddress(data.features[0].place_name);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!isOpen || !mapRef.current || !token || mapInstance.current) return;
    const loadMapbox = async () => {
      if (!window.mapboxgl) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else initMap();
    };
    const initMap = () => {
      window.mapboxgl.accessToken = token;
      const map = new window.mapboxgl.Map({ container: mapRef.current, style: 'mapbox://styles/mapbox/light-v11', center: [position.lng, position.lat], zoom: 14 });
      const marker = new window.mapboxgl.Marker({ draggable: true, color: '#C8961E' }).setLngLat([position.lng, position.lat]).addTo(map);
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setPosition({ lat: lngLat.lat, lng: lngLat.lng });
        reverseGeocode(lngLat.lat, lngLat.lng);
      });
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat);
        setPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        reverseGeocode(e.lngLat.lat, e.lngLat.lng);
      });
      mapInstance.current = map;
      markerRef.current = marker;
      reverseGeocode(position.lat, position.lng);
    };
    loadMapbox();
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(242,242,242,0.95)' }}>
        <button onClick={onClose} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', fontSize: '15px' }}>✕ Закрыть</button>
        <button onClick={() => { onConfirm(position.lat, position.lng, address); onClose(); }} style={{ background: 'var(--accent-gold)', color: '#0D0D0D', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: 600, fontSize: '14px' }}>Подтвердить</button>
      </div>
      <div ref={mapRef} style={{ flex: 1 }} />
      {address && <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>📍 {address}</div>}
    </div>
  );
}
