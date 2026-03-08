// src/components/Products/ProductDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import useThemeClasses from '../../context/useThemeClasses';
import ProductTable from './ProductTable';
import ProductForm from './ProductForm';
import ProductStats from './ProductStats';

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
    </div>
  );
};

export default ProductDashboard;