import React, { useState, useEffect, useRef } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function MapPicker({ isOpen, onClose, onConfirm, initialLat, initialLng, initialAddress }) {
  const [position, setPosition] = useState({
    lat: initialLat || 41.2995,
    lng: initialLng || 69.2401
  });
  const [address, setAddress] = useState(initialAddress || '');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // Обратное геокодирование через Mapbox API
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ru&limit=1`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const loadMapboxScript = () => {
    return new Promise((resolve) => {
      if (window.mapboxgl) {
        resolve();
        return;
      }

      // CSS
      if (!document.getElementById('mapbox-css')) {
        const link = document.createElement('link');
        link.id = 'mapbox-css';
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css';
        document.head.appendChild(link);
      }

      // JS
      if (!document.getElementById('mapbox-js')) {
        const script = document.createElement('script');
        script.id = 'mapbox-js';
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js';
        script.onload = resolve;
        script.onerror = () => console.error('Failed to load Mapbox GL JS');
        document.head.appendChild(script);
      } else {
        // Script tag exists but mapboxgl might not be ready yet
        const check = setInterval(() => {
          if (window.mapboxgl) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      }
    });
  };

  useEffect(() => {
    if (!isOpen) {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
      setMapLoaded(false);
      return;
    }

    const initMap = async () => {
      await loadMapboxScript();

      if (!mapContainerRef.current || mapInstance.current) return;

      window.mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [position.lng, position.lat],
        zoom: 14,
        language: 'ru',
      });

      // Добавляем маркер (перетаскиваемый)
      const el = document.createElement('div');
      el.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        background: #C8961E;
        transform: rotate(-45deg);
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        cursor: grab;
      `;

      const marker = new window.mapboxgl.Marker({
        element: el,
        draggable: true,
        anchor: 'bottom',
      })
        .setLngLat([position.lng, position.lat])
        .addTo(map);

      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      // Навигационные кнопки +/-
      map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      // Кнопка определения местоположения
      map.addControl(
        new window.mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserHeading: false,
        }),
        'top-right'
      );

      map.on('load', () => {
        setMapLoaded(true);
      });

      mapInstance.current = map;
      markerRef.current = marker;

      if (!address) reverseGeocode(position.lat, position.lng);
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      {/* Шапка */}
      <div style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#f8f8f8',
        borderBottom: '1px solid #ddd',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        flexShrink: 0
      }}>
        <button
          onClick={onClose}
          style={{
            color: '#666',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            padding: '8px',
            cursor: 'pointer'
          }}
        >
          ✕ Закрыть
        </button>
        <span style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>
          Выберите адрес
        </span>
        <button
          onClick={() => { onConfirm(position.lat, position.lng, address); onClose(); }}
          style={{
            background: '#C8961E',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Подтвердить
        </button>
      </div>

      {/* Подсказка */}
      <div style={{
        padding: '8px 16px',
        background: '#fffbf0',
        borderBottom: '1px solid #f0e0b0',
        fontSize: '13px',
        color: '#8a6d00',
        flexShrink: 0
      }}>
        📍 Нажмите на карту или перетащите метку для выбора точки доставки
      </div>

      {/* Контейнер карты */}
      <div
        ref={mapContainerRef}
        style={{ flex: 1, width: '100%', position: 'relative' }}
      />

      {/* Адрес снизу */}
      {address && (
        <div style={{
          padding: '14px 16px',
          background: '#fff',
          borderTop: '1px solid #eee',
          fontSize: '14px',
          color: '#333',
          lineHeight: '1.4',
          flexShrink: 0
        }}>
          📍 <strong>Ваш адрес:</strong><br />
          {address}
        </div>
      )}

      <style>{`
        .mapboxgl-canvas { width: 100% !important; height: 100% !important; }
        .mapboxgl-ctrl-group button { background-color: #fff; }
      `}</style>
    </div>
  );
}
