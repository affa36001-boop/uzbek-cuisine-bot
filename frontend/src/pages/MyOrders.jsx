import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { ordersAPI } from '../utils/api';
import { formatPrice } from '../utils/helpers';
import './MyOrders.css';

const STATUS_CONFIG = {
  accepted:         { label: 'Принят',        emoji: '📋', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
  preparing:        { label: 'Готовится',     emoji: '👨‍🍳', color: '#D49A1A', bg: 'rgba(212,154,26,0.10)' },
  cooking:          { label: 'Готовится',     emoji: '🔥', color: '#D49A1A', bg: 'rgba(212,154,26,0.10)' },
  out_for_delivery: { label: 'В пути',        emoji: '🚗', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
  delivered:        { label: 'Доставлен',     emoji: '✅', color: '#4A9A58', bg: 'rgba(74,154,88,0.10)' },
  cancelled:        { label: 'Отменён',       emoji: '❌', color: '#C0392B', bg: 'rgba(192,57,43,0.10)' },
};

function getStatus(status) {
  return STATUS_CONFIG[status] || { label: status, emoji: '❓', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersAPI.getMyOrders();
      // Sort newest first
      const sorted = (data.orders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted);
    } catch (err) {
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="my-orders-page">
      <Header title="Мои заказы" showBack />

      <div className="my-orders-content">
        {loading ? (
          <Loading message="Загружаем заказы..." />
        ) : error ? (
          <div className="mo-error">
            <span className="mo-error-icon">😔</span>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadOrders}>Попробовать снова</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mo-empty">
            <span className="mo-empty-icon">🍽️</span>
            <h2>Заказов пока нет</h2>
            <p>Сделайте первый заказ из нашего меню</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Перейти в меню
            </button>
          </div>
        ) : (
          <div className="mo-list">
            <p className="mo-count">{orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}</p>
            {orders.map((order, i) => {
              const st = getStatus(order.status);
              const expanded = expandedId === order.id;
              const items = Array.isArray(order.items) ? order.items : [];
              return (
                <div
                  key={order.id}
                  className="mo-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => toggleExpand(order.id)}
                >
                  {/* Header row */}
                  <div className="mo-card-header">
                    <div className="mo-card-left">
                      <span className="mo-order-num">#{order.order_number}</span>
                      <span className="mo-date">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="mo-status-badge" style={{ color: st.color, background: st.bg }}>
                      <span>{st.emoji}</span>
                      <span>{st.label}</span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="mo-items-preview">
                    {items.slice(0, expanded ? items.length : 2).map((item, idx) => (
                      <div key={idx} className="mo-item-row">
                        <span className="mo-item-name">{item.name}</span>
                        <span className="mo-item-qty">× {item.quantity}</span>
                        <span className="mo-item-price">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {!expanded && items.length > 2 && (
                      <span className="mo-more">+{items.length - 2} ещё...</span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="mo-details slide-up">
                      <div className="ornament-line" style={{ margin: '10px 0' }} />
                      <div className="mo-detail-row">
                        <span className="mo-detail-label">📦 Адрес</span>
                        <span className="mo-detail-value">{order.delivery_address || '—'}</span>
                      </div>
                      <div className="mo-detail-row">
                        <span className="mo-detail-label">📞 Телефон</span>
                        <span className="mo-detail-value">{order.phone || '—'}</span>
                      </div>
                      <div className="mo-detail-row">
                        <span className="mo-detail-label">💳 Оплата</span>
                        <span className="mo-detail-value">
                          {order.payment_method === 'cash' ? 'Наличные' :
                           order.payment_method === 'click' ? 'Click' :
                           order.payment_method === 'payme' ? 'Payme' : order.payment_method}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer: total + expand arrow */}
                  <div className="mo-card-footer">
                    <span className="mo-total-label">Итого</span>
                    <span className="mo-total-price">{formatPrice(order.total_amount)}</span>
                    <span className={`mo-chevron ${expanded ? 'open' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
