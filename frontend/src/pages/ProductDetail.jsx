import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../hooks/useCart';
import { productsAPI } from '../utils/api';
import { formatPrice, hapticFeedback } from '../utils/helpers';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [toppingsData, setToppingsData] = useState({});
  const [price, setPrice] = useState(0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const [prodRes, topRes] = await Promise.all([
        productsAPI.getById(id),
        productsAPI.getToppings()
      ]);
      const p = prodRes.product;
      setProduct(p);
      setToppingsData(topRes.toppings || {});
      if (p.sizes) {
        const firstSize = Object.keys(p.sizes)[0];
        setSelectedSize(firstSize);
      }
      setPrice(p.basePrice);
    } catch (err) {
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!product) return;
    let p = product.basePrice;
    if (selectedSize && product.sizes?.[selectedSize]) p *= product.sizes[selectedSize].multiplier;
    selectedToppings.forEach(tk => { if (toppingsData[tk]) p += toppingsData[tk].price; });
    setPrice(Math.round(p));
  }, [selectedSize, selectedToppings, product, toppingsData]);

  const toggleTopping = (key) => {
    setSelectedToppings(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
    hapticFeedback('light');
  };

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price,
      image: product.image,
      size: selectedSize,
      toppings: selectedToppings,
    });
    hapticFeedback('success');
    navigate(-1);
  };

  if (loading) return <><Header title="" showBack /><Loading /></>;
  if (!product) return <><Header title="" showBack /><div className="error-message">Блюдо не найдено</div></>;

  return (
    <div className="detail-page">
      <Header title={product.name} showBack />

      <div className="detail-hero">
        <img src={product.image} alt={product.name} className="detail-hero-img" />
        <div className="detail-hero-overlay" />
      </div>

      <div className="detail-content">
        <h1 className="detail-name">{product.name}</h1>
        <p className="detail-desc">{product.description}</p>

        {product.sizes && (
          <div className="detail-section">
            <h3 className="detail-section-title">{t('product.selectSize')}</h3>
            <div className="size-options">
              {Object.entries(product.sizes).map(([key, val]) => (
                <button key={key} className={`size-btn ${selectedSize === key ? 'active' : ''}`} onClick={() => { setSelectedSize(key); hapticFeedback('light'); }}>
                  <span className="size-label">{key}</span>
                  <span className="size-desc">{val.label || val.diameter}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {product.toppings?.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title">{t('product.selectToppings')}</h3>
            <div className="toppings-list">
              {product.toppings.map(tk => {
                const tp = toppingsData[tk];
                if (!tp) return null;
                const active = selectedToppings.includes(tk);
                return (
                  <button key={tk} className={`topping-btn ${active ? 'active' : ''}`} onClick={() => toggleTopping(tk)}>
                    <span className="topping-name">{tp.name}</span>
                    <span className="topping-price">+{formatPrice(tp.price)}</span>
                    <span className="topping-check">{active ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="detail-footer">
          <div className="detail-price-block">
            <span className="detail-price-label">{t('product.price')}</span>
            <span className="detail-price-value">{formatPrice(price)}</span>
          </div>
          <button className="btn btn-primary detail-add-btn" onClick={handleAdd}>
            {t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}
