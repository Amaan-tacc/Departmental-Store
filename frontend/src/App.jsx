// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { ProductProvider } from './context/ProductContext';
import { SalesProvider } from './context/SalesContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import InventoryDashboard from './components/Inventory/InventoryDashboard';
import Layout from './components/Shared/Layout';
import ProductDashboard from './components/Products/ProductDashboard';
import SalesDashboard from './components/Sales/SalesDashboard';
import Settings from './components/Settings/Settings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/dashboard" replace />;
};

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <InventoryProvider>
              <ProductProvider>
                <SalesProvider>
                  <div className="App">
                    <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } />
                    <Route path="/register" element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    } />

                    {/* Protected Routes with Layout */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="inventory" element={<InventoryDashboard />} />
                      <Route path="products" element={<ProductDashboard />} />
                      <Route path="sales" element={<SalesDashboard />} />
                      <Route path="pos" element={<SalesDashboard />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* 404 Route */}
                    <Route path="*" element={
                      <div className="min-h-screen flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                          <p className="text-gray-600 mb-4">Page not found</p>
                          <Navigate to="/dashboard" replace />
                        </div>
                      </div>
                    } />
                  </Routes>
                  <ToastContainer 
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                  />
                </div>
              </SalesProvider>
            </ProductProvider>
          </InventoryProvider>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;