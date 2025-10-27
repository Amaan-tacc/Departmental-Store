// src/components/Inventory/InventoryDashboard.js
import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import StockUpdateModal from './StockUpdateModal';
import InventoryTable from './InventoryTable';
import LowStockAlerts from './LowStockAlerts';
import InventoryStats from './InventoryStats';

const InventoryDashboard = () => {
  const { 
    inventory, 
    getInventory, 
    loading, 
    error 
  } = useInventory();
  
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    lowStock: false
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);

  useEffect(() => {
    getInventory();
  }, [getInventory]); // ✅ Added dependency

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    getInventory(newFilters);
  };

  const handleStockUpdate = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const handleStockUpdateComplete = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
    getInventory(filters);
  };

  const handleBulkUpdate = () => {
    setSelectedProduct(null); // Bulk update mode
    setShowStockModal(true);
  };

  if (loading && inventory.length === 0) { // ✅ Fixed condition
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage product stock and track inventory levels</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={handleBulkUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Bulk Update
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Inventory Stats */}
      <InventoryStats inventory={inventory} /> {/* ✅ Pass inventory prop */}

      {/* Low Stock Alerts */}
      <LowStockAlerts />

      {/* Inventory Table */}
      <InventoryTable
        inventory={inventory}
        filters={filters}
        onFilterChange={handleFilterChange}
        onStockUpdate={handleStockUpdate}
        loading={loading}
      />

      {/* Stock Update Modal */}
      {showStockModal && (
        <StockUpdateModal
          product={selectedProduct}
          onClose={() => setShowStockModal(false)}
          onUpdate={handleStockUpdateComplete}
        />
      )}
    </div>
  );
};

export default InventoryDashboard;