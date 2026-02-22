import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MapPicker from '../components/MapPicker';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../hooks/useCart';
import { useLocation } from '../contexts/LocationContext';
import { ordersAPI } from '../utils/api';
import { formatPrice, hapticFeedback, validatePhoneNumber } from '../utils/helpers';
import { branches } from '../data/branches';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { cart, total, clearCart } = useCart();
  const { location } = useLocation();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    deliveryType: 'delivery',
    address: '',
    name: '',
    phone: '+998',
    paymentMethod: 'cash',
    selectedBranchId: '',
    location: location,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const steps = [
    { label: t('checkout.stepDeliveryType'), icon: '📦' },
    { label: t('checkout.stepDetails'), icon: '📝' },
    { label: t('checkout.stepPayment'), icon: '💳' },
  ];

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const validate = (s) => {
    const errs = {};
    if (s === 0) {
      if (formData.deliveryType === 'pickup' && !formData.selectedBranchId) errs.branch = t('validation.selectBranchRequired');
    }
    if (s === 1) {
      if (formData.deliveryType === 'delivery' && !formData.address.trim()) errs.address = t('validation.addressRequired');
      if (!validatePhoneNumber(formData.phone)) errs.phone = t('validation.phoneInvalid');
    }
    if (s === 2) {
      if (!formData.paymentMethod) errs.payment = t('validation.paymentRequired');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate(step)) { setStep(s => s + 1); hapticFeedback('light'); } };
  const prev = () => { setStep(s => s - 1); hapticFeedback('light'); };

  const getDeliveryAddress = () => {
    if (formData.deliveryType === 'pickup') {
      const br = branches.find(b => b.id === formData.selectedBranchId);
      return br ? `${t(`branches.${br.id}`)} — ${br.address}` : '';
    }
    return formData.address;
  };

  const handleSubmit = async () => {
    if (!validate(2)) return;
    setLoading(true); setSubmitError(null);
    try {
      const orderData = {
        items: cart, total_amount: total,
        delivery_address: getDeliveryAddress(), phone: formData.phone, name: formData.name,
        payment_method: formData.paymentMethod, location: formData.deliveryType === 'delivery' ? formData.location : null,
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
    } finally { setLoading(false); }
  };

  if (isSuccess) {
    return (
      <div className="checkout-page">
        <Header title={t('checkout.title')} />
        <div className="checkout-success slide-up">
          <div className="success-icon">✅</div>
          <h2>{t('checkout.successTitle')}</h2>
          <p>{t('checkout.successMessage')}</p>
          {orderNumber && <div className="success-order-number">#{orderNumber}</div>}
          <button className="btn btn-primary" onClick={() => navigate('/')}>{t('common.backToMenu')}</button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="checkout-page">
      <Header title={t('checkout.title')} showBack onBack={step > 0 ? prev : undefined} />

      {/* Steps bar */}
      <div className="steps-bar">
        {steps.map((s, i) => (
          <div key={i} className={`step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <span className="step-icon">{i < step ? '✓' : s.icon}</span>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="steps-progress"><div className="steps-progress-bar" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

      <div className="checkout-body">
        {/* Step 0: Delivery Type */}
        {step === 0 && (
          <div className="step-content slide-up">
            <h3 className="step-title">{t('checkout.deliveryTypeLabel')}</h3>
            <div className="delivery-options">
              <button className={`delivery-opt ${formData.deliveryType === 'delivery' ? 'active' : ''}`} onClick={() => updateField('deliveryType', 'delivery')}>
                <span className="delivery-opt-emoji">🚗</span>
                <span>{t('checkout.deliveryOption')}</span>
              </button>
              <button className={`delivery-opt ${formData.deliveryType === 'pickup' ? 'active' : ''}`} onClick={() => updateField('deliveryType', 'pickup')}>
                <span className="delivery-opt-emoji">🏪</span>
                <span>{t('checkout.pickupOption')}</span>
              </button>
            </div>

            {formData.deliveryType === 'pickup' && (
              <div className="form-group">
                <label className="form-label">{t('checkout.chooseBranch')}</label>
                {branches.map(br => (
                  <button key={br.id} className={`branch-btn ${formData.selectedBranchId === br.id ? 'active' : ''}`} onClick={() => updateField('selectedBranchId', br.id)}>
                    <span className="branch-name">{t(`branches.${br.id}`)}</span>
                    <span className="branch-addr">{br.address}</span>
                  </button>
                ))}
                {errors.branch && <span className="error-text">{errors.branch}</span>}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="step-content slide-up">
            <h3 className="step-title">{t('checkout.stepDetails')}</h3>

            {formData.deliveryType === 'delivery' && (
              <div className="form-group">
                <label className="form-label">{t('checkout.deliveryAddress')}</label>
                <input className={`input ${errors.address ? 'error' : ''}`} value={formData.address} onChange={e => updateField('address', e.target.value)} placeholder={t('checkout.placeholderAddress')} />
                <button className="btn btn-outline map-btn" onClick={() => setShowMap(true)}>📍 {t('checkout.selectOnMap')}</button>
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('checkout.yourName')}</label>
              <input className="input" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder={t('checkout.namePlaceholder')} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('checkout.phoneNumber')}</label>
              <input className={`input ${errors.phone ? 'error' : ''}`} value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+998XXXXXXXXX" type="tel" />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="step-content slide-up">
            <h3 className="step-title">{t('checkout.orderSummary')}</h3>

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

            <h3 className="step-title" style={{ marginTop: '20px' }}>{t('checkout.paymentMethod')}</h3>
            <div className="payment-options">
              {['click', 'payme', 'cash'].map(pm => (
                <button key={pm} className={`payment-btn ${formData.paymentMethod === pm ? 'active' : ''}`} onClick={() => updateField('paymentMethod', pm)}>
                  <span className="payment-icon">{pm === 'click' ? '💎' : pm === 'payme' ? '🅿️' : '💵'}</span>
                  <span>{t(`checkout.${pm}`)}</span>
                </button>
              ))}
            </div>
            {errors.payment && <span className="error-text">{errors.payment}</span>}
            {submitError && <div className="submit-error">{submitError}</div>}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="checkout-bottom">
        {step < 2 ? (
          <button className="btn btn-primary checkout-next-btn" onClick={next}>{t('checkout.next')}</button>
        ) : (
          <button className="btn btn-primary checkout-next-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? t('checkout.processing') : t('checkout.placeOrder')}
          </button>
        )}
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
