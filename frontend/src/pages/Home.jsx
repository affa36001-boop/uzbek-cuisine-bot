import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import { useLanguage } from '../contexts/LanguageContext';
import { productsAPI, userAPI } from '../utils/api';
import { useCart } from '../hooks/useCart';
import { initTelegramWebApp, hapticFeedback } from '../utils/helpers';
import './Home.css';

const CATEGORIES = [
  { id: 'plov',     key: 'plov',     emoji: '🍚' },
  { id: 'shashlik', key: 'shashlik', emoji: '🍢' },
  { id: 'bakery',   key: 'bakery',   emoji: '🥟' },
  { id: 'soups',    key: 'soups',    emoji: '🍲' },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getItemCount, addToCart } = useCart();
  const [allProducts, setAllProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    initTelegramWebApp();
    userAPI.auth().then(r => setUser(r.user)).catch(() => {});
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      // Load ALL categories in parallel instead of sequentially
      const responses = await Promise.all(
        CATEGORIES.map(cat => productsAPI.getAll(cat.id))
      );
      const results = {};
      CATEGORIES.forEach((cat, i) => {
        results[cat.id] = responses[i]?.products || [];
      });
      setAllProducts(results);
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('home.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm) {
      return CATEGORIES.map(cat => ({
        ...cat,
        products: allProducts[cat.id] || []
      }));
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = [];

    for (const cat of CATEGORIES) {
      const productsForCategory = allProducts[cat.id] || [];
      const filteredProducts = productsForCategory.filter(product =>
        product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (product.description && product.description.toLowerCase().includes(lowerCaseSearchTerm))
      );

      if (filteredProducts.length > 0) {
        results.push({
          ...cat,
          products: filteredProducts
        });
      }
    }
    return results;
  }, [searchTerm, allProducts]);

  return (
    <div className="home-page">
      <Header
        title={t('appName')}
        showCart
        cartCount={getItemCount()}
        showOrders
        onOrders={() => {
          hapticFeedback('light');
          navigate('/my-orders');
        }}
      />

      <div className="home-content">
        {/* Welcome */}
        <div className="welcome-section">
          <h2 className="welcome-title">
            {t('home.welcome')}{user ? `, ${user.first_name}` : ''}! 🍽️
          </h2>
          <p className="welcome-subtitle">{t('home.welcomeSubtitle')}</p>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <div className="search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Поиск блюд..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')} aria-label="Очистить">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="search-result-count">
              {filteredCategories.reduce((s, c) => s + c.products.length, 0) > 0
                ? `Найдено: ${filteredCategories.reduce((s, c) => s + c.products.length, 0)} блюд`
                : ''}
            </p>
          )}
        </div>

        {/* Products */}
        {loading ? (
          <Loading message={t('home.loadingProducts')} />
        ) : error ? (
          <div className="error-message">
            <p>{t('home.failedToLoad')}</p>
            <button className="btn btn-primary" onClick={loadAllProducts}>{t('home.tryAgain')}</button>
          </div>
        ) : (
          <div className="categories-list">
            {filteredCategories.length === 0 && searchTerm ? (
              <div className="search-empty">
                <span className="search-empty-icon">🔍</span>
                <p>По запросу <strong>«{searchTerm}»</strong> ничего не найдено</p>
                <button className="btn btn-outline" onClick={() => setSearchTerm('')}>Очистить поиск</button>
              </div>
            ) : filteredCategories.length === 0 && !searchTerm ? (
              <div className="search-empty">
                <span className="search-empty-icon">🍽️</span>
                <p>Меню загружается...</p>
              </div>
            ) : (
              filteredCategories.map((cat, catIndex) => {
                const products = cat.products;
                return (
                  <div
                    key={cat.id}
                    className="category-block"
                    style={{ animationDelay: `${catIndex * 0.08}s` }}
                  >
                    {/* Category header */}
                    <div className="category-header">
                      <span className="category-emoji">{cat.emoji}</span>
                      <h3 className="category-name">{t(`home.${cat.key}`)}</h3>
                      <span className="category-count">{products.length}</span>
                    </div>

                    {/* Horizontal swipeable product row */}
                    {products.length === 0 ? (
                      <div className="empty-category">
                        <p>Скоро здесь появятся блюда</p>
                      </div>
                    ) : (
                      <div className="products-row-wrapper">
                        <div className="products-row">
                          {products.map((product) => (
                            <ProductCard key={product.id} product={product} addToCart={addToCart} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* FAB Cart */}
      {getItemCount() > 0 && (
        <div className="fab-container">
          <button className="fab" onClick={() => {
            hapticFeedback('light');
            navigate('/cart');
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
            </svg>
            <span className="fab-badge">{getItemCount()}</span>
          </button>
        </div>
      )}
    </div>
  );
}
