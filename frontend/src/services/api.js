// src/services/api.js
import axios from 'axios';

// Vite uses import.meta.env instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.patch(`/auth/reset-password/${token}`, { password }),
  logout: () => api.post('/auth/logout'),
};

// Inventory API calls
export const inventoryAPI = {
  getInventory: (params) => api.get('/inventory', { params }),
  updateStock: (id, data) => api.put(`/inventory/${id}/stock`, data),
  getLowStockAlerts: () => api.get('/inventory/low-stock'),
  getInventoryLogs: (params) => api.get('/inventory/logs', { params }),
  bulkUpdateInventory: (data) => api.post('/inventory/bulk-update', data),
};

// Product API calls
export const productAPI = {
  // Get all products with optional filters
  getProducts: (queryParams = '') => {
    return api.get(`/products?${queryParams}`);
  },

  // Get single product
  getProduct: (productId) => {
    return api.get(`/products/${productId}`);
  },

  // Create new product
  createProduct: (productData) => {
    return api.post('/products', productData);
  },

  // Update product
  updateProduct: (productId, productData) => {
    return api.put(`/products/${productId}`, productData);
  },

  // Delete product (soft delete)
  deleteProduct: (productId) => {
    return api.delete(`/products/${productId}`);
  },

  // Get categories
  getCategories: () => {
    return api.get('/products/categories');
  },

  // Search by barcode
  searchByBarcode: (barcode) => {
    return api.get(`/products/search/barcode/${barcode}`);
  },

  // Create category
  createCategory: (categoryName) => {
    return api.post('/products/categories', { name: categoryName });
  },

  // Delete category
  deleteCategory: (categoryName) => {
    return api.delete(`/products/categories/${encodeURIComponent(categoryName)}`);
  }
};

// In your api.js file
export const salesAPI = {
  processSale: (saleData) => api.post('/sales', saleData),
  getSales: (queryParams = '') => {
    console.log('API call: GET /sales?' + queryParams);
    return api.get(`/sales?${queryParams}`);
  },
  getSale: (saleId) => api.get(`/sales/${saleId}`),
  refundSale: (saleId, refundData) => api.post(`/sales/${saleId}/refund`, refundData),
  getTodaySummary: () => {
    console.log('API call: GET /sales/today/summary');
    return api.get('/sales/today/summary');
  },
  getMonthlySummary: () => {
    console.log('API call: GET /sales/monthly/summary');
    return api.get('/sales/monthly/summary');
  }
};

// Reports API calls (if you have reports endpoints)
export const reportsAPI = {
  getInventoryReport: (params) => api.get('/reports/inventory', { params }),
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getProfitReport: (params) => api.get('/reports/profit', { params }),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { 
    params,
    responseType: 'blob' // For file downloads
  }),
};

// Store API calls
export const storeAPI = {
  getSettings: () => api.get('/stores/settings'),
  updateSettings: (data) => api.patch('/stores/settings', data),
};

export default api;