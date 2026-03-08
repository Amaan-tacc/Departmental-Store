import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { productAPI } from '../services/api';
import { useSocket } from './SocketContext';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false
  });

  const getProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });

      const response = await productAPI.getProducts(queryParams.toString());
      const productsData = response.data.data.products || [];
      const paginationData = response.data.data.pagination || {};
      
      setProducts(productsData);
      setPagination(paginationData);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch products';
      setError(message);
      setProducts([]);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getProduct = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError('');
      const response = await productAPI.getProduct(productId);
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch product';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData) => {
    try {
      setError('');
      const response = await productAPI.createProduct(productData);
      
      // Add new product to local state
      setProducts(prev => [response.data.data.product, ...prev]);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create product';
      const errors = error.response?.data?.errors || [];
      setError(errors.length > 0 ? errors.join(', ') : message);
      return { success: false, error: message, errors };
    }
  }, []);

  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setError('');
      const response = await productAPI.updateProduct(productId, productData);
      
      // Update product in local state
      setProducts(prev => prev.map(product => 
        product._id === productId ? response.data.data.product : product
      ));
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update product';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteProduct = useCallback(async (productId) => {
    try {
      setError('');
      await productAPI.deleteProduct(productId);
      
      // Remove product from local state (hard delete behavior)
      setProducts(prev => prev.filter(product => product._id !== productId));
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete product';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const getCategories = useCallback(async () => {
    try {
      const response = await productAPI.getCategories();
      const categoriesData = response.data.data.categories || [];
      setCategories(categoriesData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch categories';
      console.error('Get categories error:', message);
      setCategories([]);
      return { success: false, error: message };
    }
  }, []);

  const searchByBarcode = useCallback(async (barcode) => {
    try {
      const response = await productAPI.searchByBarcode(barcode);
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Product not found';
      return { success: false, error: message };
    }
  }, []);

  // Category Management Functions
  const createCategory = useCallback(async (categoryName) => {
    try {
      setError('');
      const result = await productAPI.createCategory(categoryName);
      
      if (result.data.status === 'success') {
        // Update categories from the response
        setCategories(result.data.data.categories || []);
        return { success: true, data: result.data.data };
      } else {
        setError(result.data.message);
        return { success: false, error: result.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create category';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteCategory = useCallback(async (categoryName) => {
    try {
      setError('');
      const result = await productAPI.deleteCategory(categoryName);
      
      if (result.data.status === 'success') {
        // Update categories from the response
        setCategories(result.data.data.categories || []);
        return { success: true, data: result.data.data };
      } else {
        setError(result.data.message);
        return { success: false, error: result.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete category';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Handle real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      const handleProductChange = () => {
        getProducts();
        getCategories();
      };

      socket.on('productCreated', handleProductChange);
      socket.on('productUpdated', handleProductChange);
      socket.on('productDeleted', handleProductChange);
      socket.on('categoryCreated', handleProductChange);
      socket.on('categoryDeleted', handleProductChange);
      socket.on('inventoryUpdated', handleProductChange);

      return () => {
        socket.off('productCreated', handleProductChange);
        socket.off('productUpdated', handleProductChange);
        socket.off('productDeleted', handleProductChange);
        socket.off('categoryCreated', handleProductChange);
        socket.off('categoryDeleted', handleProductChange);
        socket.off('inventoryUpdated', handleProductChange);
      };
    }
  }, [socket, isConnected, getProducts, getCategories]);

  const value = {
  products,
  categories,
  loading,
  error,
  pagination,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,  // Make sure this is included
  searchByBarcode,
  createCategory,
  deleteCategory,
  clearError
};

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};