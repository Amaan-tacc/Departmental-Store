import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import { useSocket } from './SocketContext';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket, isConnected } = useSocket();

  // ✅ Stable function references with useCallback
  const getInventory = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      const response = await inventoryAPI.getInventory(filters);
      
      const inventoryData = response.data?.data?.inventory || 
                           response.data?.inventory || 
                           [];
      setInventory(inventoryData);
      
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch inventory';
      setError(message);
      setInventory([]);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getLowStockAlerts = useCallback(async () => {
    try {
      // Don't set loading here to avoid UI flickering
      const response = await inventoryAPI.getLowStockAlerts();
      
      const lowStockData = response.data?.data?.lowStockProducts || 
                          response.data?.lowStockProducts || 
                          [];
      setLowStockAlerts(lowStockData);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch low stock alerts';
      console.error('Low stock alerts error:', message);
      setLowStockAlerts([]);
      return { success: false, error: message };
    }
  }, []); // ✅ No dependencies to keep it stable

  const updateStock = useCallback(async (productId, stockData) => {
    try {
      setError('');
      const response = await inventoryAPI.updateStock(productId, stockData);
      
      setInventory(prev => prev.map(product => 
        product._id === productId 
          ? { ...product, quantity: response.data.data.product.quantity }
          : product
      ));
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update stock';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const getInventoryLogs = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      const response = await inventoryAPI.getInventoryLogs(filters);
      
      const logsData = response.data?.data?.logs || 
                      response.data?.logs || 
                      [];
      setInventoryLogs(logsData);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch inventory logs';
      setError(message);
      setInventoryLogs([]);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateInventory = useCallback(async (updates) => {
    try {
      setError('');
      const response = await inventoryAPI.bulkUpdateInventory({ updates });
      
      await getInventory();
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to bulk update inventory';
      setError(message);
      return { success: false, error: message };
    }
  }, [getInventory]);

  // Handle real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      const handleInventoryChange = () => {
        console.log('Real-time inventory update received');
        getInventory();
        getLowStockAlerts();
      };

      socket.on('inventoryUpdated', handleInventoryChange);
      socket.on('productUpdated', handleInventoryChange);
      socket.on('productCreated', handleInventoryChange);
      socket.on('productDeleted', handleInventoryChange);
      socket.on('saleProcessed', handleInventoryChange);

      return () => {
        socket.off('inventoryUpdated', handleInventoryChange);
        socket.off('productUpdated', handleInventoryChange);
        socket.off('productCreated', handleInventoryChange);
        socket.off('productDeleted', handleInventoryChange);
        socket.off('saleProcessed', handleInventoryChange);
      };
    }
  }, [socket, isConnected, getInventory, getLowStockAlerts]);

  const value = {
    inventory,
    lowStockAlerts,
    inventoryLogs,
    loading,
    error,
    getInventory,
    updateStock,
    getLowStockAlerts,
    getInventoryLogs,
    bulkUpdateInventory,
    setError
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};