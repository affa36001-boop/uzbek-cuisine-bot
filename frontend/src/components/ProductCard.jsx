import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/helpers';
import './ProductCard.css';

export default function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleAdd = (e) => {
    e.stopPropagation();
    if (product.sizes || product.toppings) {
      navigate(`/product/${product.id}`);
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.basePrice,
      image: product.image,
      size: null,
    });
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-card-img-wrap">
        <img src={product.image} alt={product.name} className="product-card-img" loading="lazy" />
        <div className="product-card-img-overlay" />
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price">{formatPrice(product.basePrice)}</span>
          <button className="product-card-add" onClick={handleAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
