import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { LocationProvider } from './contexts/LocationContext';
import { CartProvider } from './hooks/useCart';
import './styles/global.css';

// Warm up the backend immediately (Railway cold start)
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
if (API_BASE) {
  fetch(`${API_BASE}/api/health`, { mode: 'cors' }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <LocationProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </LocationProvider>
    </LanguageProvider>
  </React.StrictMode>
);
