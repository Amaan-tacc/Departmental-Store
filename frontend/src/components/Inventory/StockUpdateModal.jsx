// src/components/Inventory/StockUpdateModal.js
import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';

const StockUpdateModal = ({ product, onClose, onUpdate }) => {
  const { updateStock, bulkUpdateInventory } = useInventory();
  const [formData, setFormData] = useState({
    action: 'add',
    quantity: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBulkUpdate = !product;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.quantity || formData.quantity <= 0) {
      setError('Please enter a valid quantity');
      setLoading(false);
      return;
    }

    try {
      if (isBulkUpdate) {
        // Handle bulk update logic here
        setError('Bulk update functionality not implemented yet');
      } else {
        const result = await updateStock(product._id, {
          ...formData,
          quantity: parseInt(formData.quantity)
        });

        if (result.success) {
          onUpdate();
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const getActionDescription = () => {
    if (isBulkUpdate) {
      return `Bulk ${formData.action} operation`;
    }
    
    switch (formData.action) {
      case 'add': return `Add ${formData.quantity || 0} units to current stock`;
      case 'subtract': return `Remove ${formData.quantity || 0} units from current stock`;
      case 'set': return `Set stock level to ${formData.quantity || 0} units`;
      default: return '';
    }
  };

  const calculateNewQuantity = () => {
    if (isBulkUpdate || !formData.quantity || formData.quantity === '') {
      return product?.quantity || 0;
    }
    
    const quantity = parseInt(formData.quantity);
    switch (formData.action) {
      case 'add': return product.quantity + quantity;
      case 'subtract': return Math.max(0, product.quantity - quantity);
      case 'set': return quantity;
      default: return product.quantity;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {isBulkUpdate ? 'Bulk Update Stock' : `Update Stock - ${product?.name}`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Stock Info - Only show for single product update */}
        {!isBulkUpdate && product && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Current Stock</p>
                <p className="font-medium text-gray-900">{product.quantity} units</p>
              </div>
              <div>
                <p className="text-gray-600">Low Stock Threshold</p>
                <p className="font-medium text-gray-900">{product.lowStockThreshold} units</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              name="action"
              value={formData.action}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Remove Stock</option>
              <option value="set">Set Stock Level</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., New shipment, Damage, etc."
            />
          </div>

          {/* Preview - Only show for single product update */}
          {!isBulkUpdate && formData.quantity && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-1">Preview</p>
              <p className="text-sm text-blue-700">{getActionDescription()}</p>
              <p className="text-sm text-blue-700 mt-1">
                New stock level: <span className="font-semibold">{calculateNewQuantity()} units</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : (isBulkUpdate ? 'Bulk Update' : 'Update Stock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockUpdateModal;