// src/components/Products/ProductDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import useThemeClasses from '../../context/useThemeClasses';
import ProductTable from './ProductTable';
import ProductForm from './ProductForm';
import ProductStats from './ProductStats';
import BarcodeScanner from './BarcodeScanner';

const ProductDashboard = () => {
  const { 
    products, 
    getProducts, 
    loading, 
    error,
    pagination 
  } = useProducts();
  
  const { user } = useAuth();
  const theme = useThemeClasses();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    lowStock: false,
    page: 1,
    limit: 10
  });
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      await getProducts(filters);
    };
    loadProducts();
  }, [getProducts, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductFormClose = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleProductFormSuccess = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    getProducts(filters);
  };

  const handleBarcodeScan = (barcode) => {
    setFilters(prev => ({ ...prev, search: barcode }));
    setShowBarcodeScanner(false);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${theme.card} rounded-lg shadow-sm border p-6 transition-colors duration-300`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>Product Management</h1>
            <p className={`${theme.textSecondary} mt-1`}>Manage your product catalog and inventory</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${theme.isDark ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan Barcode
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={handleCreateProduct}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 transition-colors">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Product Stats */}
      <ProductStats />

      {/* Product Table */}
      <ProductTable
        products={products}
        filters={filters}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onEditProduct={handleEditProduct}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleProductFormClose}
          onSuccess={handleProductFormSuccess}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onClose={() => setShowBarcodeScanner(false)}
          onScan={handleBarcodeScan}
        />
      )}
    </div>
  );
};

export default ProductDashboard;