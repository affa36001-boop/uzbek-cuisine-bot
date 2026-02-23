import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loading from './components/Loading';

// Lazy load pages — only Home loads immediately, others load on demand
const Home = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const MyOrders = lazy(() => import('./pages/MyOrders'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading message="Загрузка..." />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/checkout" element={<Navigate to="/cart" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
