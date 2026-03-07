// context/SalesContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import { salesAPI } from '../services/api';

const SalesContext = createContext();

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [currentSale, setCurrentSale] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalSales: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10
  });
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalTax: 0
  });

// In your SalesContext, update the getSales function:
const getSales = useCallback(async (filters = {}) => {
  try {
    setLoading(true);
    setError('');
    
    console.log('🔄 Getting sales with filters:', filters);
    
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    });

    const response = await salesAPI.getSales(queryParams.toString());
    console.log('📦 Raw API response:', response.data);
    
    // More robust data extraction
    const responseData = response.data.data || response.data;
    console.log('🔍 Extracted response data:', responseData);
    
    const salesData = responseData.sales || [];
    const paginationData = responseData.pagination || {};
    
    // Handle different summary structures
    let summaryData = {};
    if (responseData.summary) {
      summaryData = responseData.summary;
    } else if (responseData.data?.summary) {
      summaryData = responseData.data.summary;
    } else {
      // Calculate summary from sales data as fallback
      summaryData = salesData.reduce((acc, sale) => {
        if (!sale.isRefund) {
          acc.totalSales = (acc.totalSales || 0) + (sale.total || 0);
          acc.totalTransactions = (acc.totalTransactions || 0) + 1;
          acc.totalTax = (acc.totalTax || 0) + (sale.tax || 0);
        }
        return acc;
      }, { totalSales: 0, totalTransactions: 0, totalTax: 0 });
    }
    
    console.log('📈 Final parsed data:', {
      salesCount: salesData.length,
      pagination: paginationData,
      summary: summaryData
    });
    
    setSales(salesData);
    setPagination(paginationData);
    setSummary(summaryData);
    
    return { success: true, data: responseData };
  } catch (error) {
    console.error('❌ Get sales error:', error);
    const message = error.response?.data?.message || error.message || 'Failed to fetch sales';
    setError(message);
    setSales([]);
    return { success: false, error: message };
  } finally {
    setLoading(false);
  }
}, []);

  // Process new sale
  const processSale = useCallback(async (saleData) => {
    try {
      setLoading(true);
      setError('');
      const response = await salesAPI.processSale(saleData);
      
      // Clear cart after successful sale
      setCart([]);
      setCurrentSale(response.data.data.sale);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to process sale';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get today's summary
  const getTodaySummary = useCallback(async () => {
    try {
      const response = await salesAPI.getTodaySummary();
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch today\'s summary';
      console.error('Get today summary error:', message);
      return { success: false, error: message };
    }
  }, []);

  // Get monthly summary
  const getMonthlySummary = useCallback(async () => {
    try {
      const response = await salesAPI.getMonthlySummary();
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch monthly summary';
      console.error('Get monthly summary error:', message);
      return { success: false, error: message };
    }
  }, []);

  // Process refund
  const refundSale = useCallback(async (saleId, refundData) => {
    try {
      setError('');
      const response = await salesAPI.refundSale(saleId, refundData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to process refund';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // Cart management functions...
  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, {
          product,
          quantity,
          price: product.price,
          total: product.price * quantity
        }];
      }
    });
  }, []);

  const updateCartItem = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product._id === productId
          ? {
              ...item,
              quantity,
              total: item.price * quantity
            }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate cart totals
  const cartTotals = React.useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 8.0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      itemsCount: cart.reduce((count, item) => count + item.quantity, 0)
    };
  }, [cart]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const value = {
    sales,
    currentSale,
    cart,
    loading,
    error,
    pagination,
    summary,
    cartTotals,
    processSale,
    getSales,
    refundSale,
    getTodaySummary,
    getMonthlySummary,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    clearError
  };

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};