// src/components/Inventory/LowStockAlerts.js
import React, { useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';

const LowStockAlerts = () => {
  const { lowStockAlerts, getLowStockAlerts } = useInventory();

  // ✅ Call getLowStockAlerts only once when component mounts
  useEffect(() => {
    getLowStockAlerts();
  }, [getLowStockAlerts]); // ✅ Now getLowStockAlerts is stable due to useCallback

  // ✅ Ensure lowStockAlerts is always an array
  const safeLowStockAlerts = Array.isArray(lowStockAlerts) ? lowStockAlerts : [];

  if (safeLowStockAlerts.length === 0) {
    return null;
  }

  const handleViewAll = () => {
    // Optional: Implement view all functionality
    console.log('View all low stock alerts');
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alerts</h3>
        </div>
        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {safeLowStockAlerts.length} items
        </span>
      </div>

      <div className="grid gap-3">
        {safeLowStockAlerts.slice(0, 5).map((product) => (
          <div key={product._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">{product.category} • {product.barcode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-yellow-700">
                {product.quantity} / {product.lowStockThreshold}
              </p>
              <p className="text-xs text-gray-500">Current / Threshold</p>
            </div>
          </div>
        ))}
      </div>

      {safeLowStockAlerts.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={handleViewAll}
            className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
          >
            View all {safeLowStockAlerts.length} alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;