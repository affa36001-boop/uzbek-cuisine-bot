import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();

const CART_KEY = 'uzbek_cuisine_cart';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => { saveCart(cart); }, [cart]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const key = `${product.productId || product.id}-${product.size || 'default'}`;
      const existing = prev.find(i => `${i.productId || i.id}-${i.size || 'default'}` === key);
      if (existing) return prev.map(i => `${i.productId || i.id}-${i.size || 'default'}` === key ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, id: key, productId: product.productId || product.id, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) { setCart(prev => prev.filter(i => i.id !== itemId)); return; }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  }, []);

  const clearCart = useCallback(() => { setCart([]); }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getItemCount = useCallback(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
