const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function getTelegramInitData() {
  if (window.Telegram?.WebApp?.initData) return window.Telegram.WebApp.initData;
  return null;
}

async function apiCall(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...options.headers };
  const initData = getTelegramInitData();
  if (initData) headers['X-Telegram-Init-Data'] = initData;

  const config = { ...options, headers };
  if (options.body && typeof options.body === 'object') config.body = JSON.stringify(options.body);

  const fullPath = `${API_BASE}${endpoint}`;
  const url = new URL(fullPath, window.location.origin);
  url.searchParams.set('ngrok-skip-browser-warning', '1');

  const response = await fetch(url.toString(), config);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API request failed');
  return data;
}

export const userAPI = {
  auth: () => apiCall('/api/users/auth', { method: 'POST' }),
  getMe: () => apiCall('/api/users/me'),
};

export const productsAPI = {
  getAll: (category = null) => {
    const query = category ? `?category=${category}` : '';
    return apiCall(`/api/products${query}`);
  },
  getById: (id) => apiCall(`/api/products/${id}`),
  calculatePrice: (productId, size, toppings) => apiCall('/api/products/calculate-price', { method: 'POST', body: { productId, size, toppings } }),
  getToppings: () => apiCall('/api/products/toppings/all'),
};

export const ordersAPI = {
  create: (orderData) => apiCall('/api/orders', { method: 'POST', body: orderData }),
  track: (orderNumber) => apiCall(`/api/orders/track/${orderNumber}`),
  getMyOrders: () => apiCall('/api/orders/my-orders'),
  updateStatus: (orderId, status) => apiCall(`/api/orders/${orderId}/status`, { method: 'PATCH', body: { status } }),
  admin: {
    getAll: (limit = 50, password) => apiCall(`/api/orders/admin/all?limit=${limit}`, { headers: { 'X-Admin-Password': password } }),
    updateStatus: (orderId, status, password) => apiCall(`/api/orders/admin/${orderId}/status`, { method: 'PATCH', body: { status }, headers: { 'X-Admin-Password': password } }),
    getStats: (password) => apiCall('/api/orders/admin/stats', { headers: { 'X-Admin-Password': password } }),
  },
};

export const routeAPI = {
  getRoute: (body) => apiCall('/api/route', { method: 'POST', body }),
};

export const healthCheck = () => apiCall('/api/health');
