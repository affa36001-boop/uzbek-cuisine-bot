import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MapPicker from '../components/MapPicker';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../hooks/useCart';
import { useLocation } from '../contexts/LocationContext';
import { ordersAPI } from '../utils/api';
import { formatPrice, hapticFeedback, validatePhoneNumber } from '../utils/helpers';
import { branches } from '../data/branches';
import './Cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { cart, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { location: userLocation } = useLocation();

  const [formData, setFormData] = useState({
    deliveryType: 'delivery',
    address: '',
    name: '',
    phone: '+998',
    paymentMethod: 'cash',
    selectedBranchId: '',
    location: userLocation,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Refs for scrolling to sections
  const deliveryRef = useRef(null);
  const detailsRef = useRef(null);
  const paymentRef = useRef(null);

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = {};
    if (formData.deliveryType === 'pickup' && !formData.selectedBranchId) {
      errs.branch = t('validation.selectBranchRequired');
    }
    if (formData.deliveryType === 'delivery' && !formData.address.trim()) {
      errs.address = t('validation.addressRequired');
    }
    if (!validatePhoneNumber(formData.phone)) {
      errs.phone = t('validation.phoneInvalid');
    }
    if (!formData.paymentMethod) {
      errs.payment = t('validation.paymentRequired');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getDeliveryAddress = () => {
    if (formData.deliveryType === 'pickup') {
      const br = branches.find(b => b.id === formData.selectedBranchId);
      return br ? `${t(`branches.${br.id}`)} — ${br.address}` : '';
    }
    return formData.address;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      hapticFeedback('error');
      // Scroll to first error
      if (errors.branch || errors.address) {
        deliveryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.phone) {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const orderData = {
        items: cart,
        total_amount: total,
        delivery_address: getDeliveryAddress(),
        phone: formData.phone,
        name: formData.name,
        payment_method: formData.paymentMethod,
        location: formData.deliveryType === 'delivery' ? formData.location : null,
        delivery_type: formData.deliveryType,
        branch_id: formData.deliveryType === 'pickup' ? formData.selectedBranchId : null,
        lang: t('lang_code') || 'ru',
      };
      const response = await ordersAPI.create(orderData);
      setOrderNumber(response?.order?.order_number || null);
      setIsSuccess(true);
      clearCart();
      hapticFeedback('success');
    } catch (error) {
      setSubmitError(error?.message || t('checkout.errorOrder'));
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="cart-page">
        <Header title={t('cart.title')} />
        <div className="checkout-success-full slide-up">
          <div className="success-icon-big">✅</div>
          <h2>{t('checkout.successTitle')}</h2>
          <p>{t('checkout.successMessage')}</p>
          {orderNumber && <div className="success-order-num">#{orderNumber}</div>}
          <button className="btn btn-primary" onClick={() => navigate('/')}>{t('common.backToMenu')}</button>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <Header title={t('cart.title')} showBack />
        <div className="cart-empty">
          <span className="cart-empty-icon">🍽️</span>
          <h2>{t('cart.empty')}</h2>
          <p>{t('cart.emptySubtitle')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>{t('common.backToMenu')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header title={t('cart.title')} showBack />

      <div className="cart-scroll-content">
        {/* ═══════ CART ITEMS ═══════ */}
        <section className="cart-section">
          <div className="section-header">
            <span className="section-icon">🛒</span>
            <h3 className="section-title">{t('cart.title')}</h3>
          </div>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  {item.size && <span className="cart-item-size">{item.size}</span>}
                  <span className="cart-item-price">{formatPrice(item.price)}</span>
                </div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => { updateQuantity(item.id, item.quantity - 1); hapticFeedback('light'); }}>−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => { updateQuantity(item.id, item.quantity + 1); hapticFeedback('light'); }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-subtotal">
            <span>{t('common.total')}</span>
            <span className="cart-subtotal-price">{formatPrice(total)}</span>
          </div>
        </section>

        <div className="ornament-line" />

        {/* ═══════ DELIVERY TYPE ═══════ */}
        <section className="cart-section" ref={deliveryRef}>
          <div className="section-header">
            <span className="section-icon">📦</span>
            <h3 className="section-title">{t('checkout.stepDeliveryType')}</h3>
          </div>
          <div className="delivery-options">
            <button
              className={`delivery-opt ${formData.deliveryType === 'delivery' ? 'active' : ''}`}
              onClick={() => updateField('deliveryType', 'delivery')}
            >
              <span className="delivery-opt-emoji">🚗</span>
              <span>{t('checkout.deliveryOption')}</span>
            </button>
            <button
              className={`delivery-opt ${formData.deliveryType === 'pickup' ? 'active' : ''}`}
              onClick={() => updateField('deliveryType', 'pickup')}
            >
              <span className="delivery-opt-emoji">🏪</span>
              <span>{t('checkout.pickupOption')}</span>
            </button>
          </div>

          {formData.deliveryType === 'pickup' && (
            <div className="form-group">
              <label className="form-label">{t('checkout.chooseBranch')}</label>
              {branches.map(br => (
                <button
                  key={br.id}
                  className={`branch-btn ${formData.selectedBranchId === br.id ? 'active' : ''}`}
                  onClick={() => updateField('selectedBranchId', br.id)}
                >
                  <span className="branch-name">{t(`branches.${br.id}`)}</span>
                  <span className="branch-addr">{br.address}</span>
                </button>
              ))}
              {errors.branch && <span className="error-text">{errors.branch}</span>}
            </div>
          )}
        </section>

        <div className="ornament-line" />

        {/* ═══════ CONTACT DETAILS ═══════ */}
        <section className="cart-section" ref={detailsRef}>
          <div className="section-header">
            <span className="section-icon">📝</span>
            <h3 className="section-title">{t('checkout.stepDetails')}</h3>
          </div>

          {formData.deliveryType === 'delivery' && (
            <div className="form-group">
              <label className="form-label">{t('checkout.deliveryAddress')}</label>
              <input
                className={`input ${errors.address ? 'error' : ''}`}
                value={formData.address}
                onChange={e => updateField('address', e.target.value)}
                placeholder={t('checkout.placeholderAddress')}
              />
              <button className="btn btn-outline map-btn" onClick={() => setShowMap(true)}>
                📍 {t('checkout.selectOnMap')}
              </button>
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('checkout.yourName')}</label>
            <input
              className="input"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder={t('checkout.namePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('checkout.phoneNumber')}</label>
            <input
              className={`input ${errors.phone ? 'error' : ''}`}
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="+998XXXXXXXXX"
              type="tel"
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
        </section>

        <div className="ornament-line" />

        {/* ═══════ PAYMENT ═══════ */}
        <section className="cart-section" ref={paymentRef}>
          <div className="section-header">
            <span className="section-icon">💳</span>
            <h3 className="section-title">{t('checkout.paymentMethod')}</h3>
          </div>
          <div className="payment-options">
            {['click', 'payme', 'cash'].map(pm => (
              <button
                key={pm}
                className={`payment-btn ${formData.paymentMethod === pm ? 'active' : ''}`}
                onClick={() => updateField('paymentMethod', pm)}
              >
                <span className="payment-icon">{pm === 'click' ? '💎' : pm === 'payme' ? '🅿️' : '💵'}</span>
                <span>{t(`checkout.${pm}`)}</span>
              </button>
            ))}
          </div>
          {errors.payment && <span className="error-text">{errors.payment}</span>}
        </section>

        <div className="ornament-line" />

        {/* ═══════ ORDER SUMMARY ═══════ */}
        <section className="cart-section">
          <div className="section-header">
            <span className="section-icon">📋</span>
            <h3 className="section-title">{t('checkout.orderSummary')}</h3>
          </div>
          <div className="order-summary">
            {cart.map(item => (
              <div key={item.id} className="summary-row">
                <span>{item.name} × {item.quantity}</span>
                <span className="summary-price">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="ornament-line" style={{ margin: '8px 0' }} />
            <div className="summary-row total">
              <span>{t('common.total')}</span>
              <span className="summary-price">{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {submitError && (
          <div className="submit-error">{submitError}</div>
        )}

        {/* ═══════ SUBMIT BUTTON ═══════ */}
        <div className="cart-submit-area">
          <button
            className="btn btn-primary cart-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t('checkout.processing') : t('checkout.placeOrder')}
          </button>
        </div>
      </div>

      <MapPicker
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={(lat, lng, addr) => {
          updateField('location', { latitude: lat, longitude: lng });
          if (addr) updateField('address', addr);
        }}
        initialLat={formData.location?.latitude}
        initialLng={formData.location?.longitude}
        initialAddress={formData.address}
      />
    </div>
  );
}
