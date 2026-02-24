import React, { useState, useEffect, useRef } from 'react';

export default function MapPicker({ isOpen, onClose, onConfirm, initialLat, initialLng, initialAddress }) {
  const [position, setPosition] = useState({ 
    lat: initialLat || 41.2995, 
    lng: initialLng || 69.2401 
  });
  const [address, setAddress] = useState(initialAddress || '');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // Обратное геокодирование через Nominatim (бесплатно)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ru`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      return;
    }

    const initMap = () => {
      if (!mapRef.current || mapInstance.current || !window.L) return;

      // Инициализация карты Leaflet
      const map = window.L.map(mapRef.current).setView([position.lat, position.lng], 14);
      
      // Добавляем слой карты (OpenStreetMap)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Добавляем маркер
      const marker = window.L.marker([position.lat, position.lng], {
        draggable: true
      }).addTo(map);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      mapInstance.current = map;
      markerRef.current = marker;

      // Форсируем обновление размера для корректного отображения
      setTimeout(() => map.invalidateSize(), 200);
      
      if (!address) reverseGeocode(position.lat, position.lng);
    };

    // Загрузка Leaflet стилей и скриптов, если их еще нет
    if (window.L) {
      initMap();
    } else {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        const checkL = setInterval(() => {
          if (window.L) {
            clearInterval(checkL);
            initMap();
          }
        }, 100);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
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
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            color: '#666', 
            background: 'none', 
            border: 'none', 
            fontSize: '16px',
            padding: '8px' 
          }}
        >
          ✕ Закрыть
        </button>
        <button 
          onClick={() => { onConfirm(position.lat, position.lng, address); onClose(); }} 
          style={{ 
            background: '#C8961E', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            padding: '10px 20px', 
            fontWeight: '600', 
            fontSize: '14px' 
          }}
        >
          Подтвердить
        </button>
      </div>

      {/* Контейнер карты */}
      <div ref={mapRef} style={{ flex: 1, width: '100%', height: '100%' }} />

      {/* Адрес снизу */}
      {address && (
        <div style={{ 
          padding: '16px', 
          background: '#fff', 
          borderTop: '1px solid #eee', 
          fontSize: '14px', 
          color: '#333',
          lineHeight: '1.4'
        }}>
          📍 <strong>Ваш адрес:</strong><br/>
          {address}
        </div>
      )}

      {/* Кастомные стили для Leaflet чтобы маркер был виден корректно */}
      <style>{`
        .leaflet-container { height: 100%; width: 100%; }
        .leaflet-marker-icon { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
      `}</style>
    </div>
  );
}
