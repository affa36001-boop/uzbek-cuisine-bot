import React, { useState, useEffect, useRef } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function MapPicker({ isOpen, onClose, onConfirm, initialLat, initialLng, initialAddress }) {
  const [position, setPosition] = useState(null); // null = точка не выбрана
  const [address, setAddress] = useState(initialAddress || '');
  const [markerVisible, setMarkerVisible] = useState(false); // маркер доставки виден только после нажатия
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const geolocateRef = useRef(null);

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
      if (window.mapboxgl) { resolve(); return; }

      if (!document.getElementById('mapbox-css')) {
        const link = document.createElement('link');
        link.id = 'mapbox-css';
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('mapbox-js')) {
        const script = document.createElement('script');
        script.id = 'mapbox-js';
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js';
        script.onload = resolve;
        script.onerror = () => console.error('Failed to load Mapbox GL JS');
        document.head.appendChild(script);
      } else {
        const check = setInterval(() => {
          if (window.mapboxgl) { clearInterval(check); resolve(); }
        }, 100);
      }
    });
  };

  // Создаём кастомный элемент маркера доставки (золотая булавка со стрелкой вниз)
  const createDeliveryMarkerEl = () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: grab;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
      animation: markerDrop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    // Иконка машины/стрелки доставки
    const pin = document.createElement('div');
    pin.innerHTML = `
      <svg width="44" height="54" viewBox="0 0 44 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Тень -->
        <ellipse cx="22" cy="52" rx="8" ry="3" fill="rgba(0,0,0,0.18)"/>
        <!-- Булавка -->
        <path d="M22 2C13.163 2 6 9.163 6 18C6 30 22 50 22 50C22 50 38 30 38 18C38 9.163 30.837 2 22 2Z" fill="#C8961E" stroke="#fff" stroke-width="2.5"/>
        <!-- Иконка грузовика доставки внутри -->
        <text x="22" y="23" text-anchor="middle" font-size="14" fill="white">🚗</text>
      </svg>
    `;
    wrapper.appendChild(pin);
    return wrapper;
  };

  useEffect(() => {
    if (!isOpen) {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        deliveryMarkerRef.current = null;
        geolocateRef.current = null;
      }
      setMarkerVisible(false);
      setPosition(null);
      setAddress(initialAddress || '');
      return;
    }

    const initMap = async () => {
      await loadMapboxScript();
      if (!mapContainerRef.current || mapInstance.current) return;

      window.mapboxgl.accessToken = MAPBOX_TOKEN;

      // Начальный центр — Ташкент (если нет initialLat/Lng)
      const initCenter = (initialLng && initialLat)
        ? [initialLng, initialLat]
        : [69.2401, 41.2995];

      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initCenter,
        zoom: 13,
        language: 'ru',
      });

      // ── Кнопка геолокации (автоматически срабатывает при загрузке) ──
      const geolocate = new window.mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,      // синий кружок следит за тобой
        showUserHeading: true,         // стрелка направления
        showAccuracyCircle: true,      // полупрозрачный круг точности
      });

      map.addControl(geolocate, 'top-right');
      map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      geolocateRef.current = geolocate;

      // Автоматически запускаем геолокацию после загрузки карты
      map.on('load', () => {
        geolocate.trigger(); // запрашивает разрешение и показывает синий кружок
      });

      // ── Маркер доставки (появляется только после нажатия) ──
      const deliveryEl = createDeliveryMarkerEl();

      const deliveryMarker = new window.mapboxgl.Marker({
        element: deliveryEl,
        draggable: true,
        anchor: 'bottom',
      });
      // Пока НЕ добавляем на карту — только после клика

      // При клике на карту — ставим/перемещаем маркер доставки
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setPosition({ lat, lng });
        setMarkerVisible(true);

        if (!deliveryMarker._map) {
          // Первый раз — добавляем на карту
          deliveryMarker.setLngLat([lng, lat]).addTo(map);
        } else {
          deliveryMarker.setLngLat([lng, lat]);
        }

        reverseGeocode(lat, lng);
      });

      // При перетаскивании маркера
      deliveryMarker.on('dragend', () => {
        const { lng, lat } = deliveryMarker.getLngLat();
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });

      mapInstance.current = map;
      deliveryMarkerRef.current = deliveryMarker;

      // Если была ранее выбранная точка — показываем сразу
      if (initialLat && initialLng) {
        setTimeout(() => {
          deliveryMarker.setLngLat([initialLng, initialLat]).addTo(map);
          setPosition({ lat: initialLat, lng: initialLng });
          setMarkerVisible(true);
          if (initialAddress) setAddress(initialAddress);
          else reverseGeocode(initialLat, initialLng);
        }, 500);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        deliveryMarkerRef.current = null;
        geolocateRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = position !== null;

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
          📦 Точка доставки
        </span>
        <button
          onClick={() => {
            if (canConfirm) {
              onConfirm(position.lat, position.lng, address);
              onClose();
            }
          }}
          style={{
            background: canConfirm ? '#C8961E' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s'
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
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {!markerVisible ? (
          <>🗺️ <span>Нажмите на карту, чтобы указать точку доставки</span></>
        ) : (
          <>✅ <span>Точка выбрана — перетащите метку для уточнения</span></>
        )}
      </div>

      {/* Контейнер карты */}
      <div
        ref={mapContainerRef}
        style={{ flex: 1, width: '100%', position: 'relative' }}
      />

      {/* Адрес снизу */}
      {address && markerVisible && (
        <div style={{
          padding: '14px 16px',
          background: '#fff',
          borderTop: '2px solid #C8961E',
          fontSize: '14px',
          color: '#333',
          lineHeight: '1.4',
          flexShrink: 0
        }}>
          🚗 <strong>Доставить сюда:</strong><br />
          <span style={{ color: '#555' }}>{address}</span>
        </div>
      )}

      <style>{`
        .mapboxgl-canvas { width: 100% !important; height: 100% !important; }
        .mapboxgl-ctrl-group button { background-color: #fff; }
        .mapboxgl-user-location-dot {
          background-color: #1a73e8 !important;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.3) !important;
        }
        @keyframes markerDrop {
          0%   { transform: translateY(-20px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(26,115,232,0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(26,115,232,0); }
          100% { box-shadow: 0 0 0 0 rgba(26,115,232,0); }
        }
        .mapboxgl-user-location-dot {
          animation: pulse 2s infinite !important;
        }
      `}</style>
    </div>
  );
}
