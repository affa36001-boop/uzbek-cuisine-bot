import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { LocationProvider } from './contexts/LocationContext';
import { CartProvider } from './hooks/useCart';
import './styles/global.css';

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
