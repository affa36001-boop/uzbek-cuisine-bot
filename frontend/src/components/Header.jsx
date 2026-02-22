import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header({
  title,
  showBack = false,
  showCart = false,
  cartCount = 0,
  onBack,
  showOrders = false,
  onOrders,
}) {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-inner">
        {/* Left: back button OR orders button OR spacer */}
        {showBack ? (
          <button className="header-back" onClick={onBack || (() => navigate(-1))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : showOrders ? (
          <button className="header-orders" onClick={onOrders} title="Мои заказы">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        ) : (
          <div className="header-spacer" />
        )}

        <h1 className="header-title">{title}</h1>

        {/* Right: cart button OR spacer */}
        {showCart ? (
          <button className="header-cart" onClick={() => navigate('/cart')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
            </svg>
            {cartCount > 0 && <span className="header-cart-badge">{cartCount}</span>}
          </button>
        ) : (
          <div className="header-spacer" />
        )}
      </div>
      <div className="ornament-line" />
    </header>
  );
}
