// src/components/Inventory/StockUpdateModal.js
import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import useThemeClasses from '../../context/useThemeClasses';

const StockUpdateModal = ({ product, onClose, onUpdate }) => {
  const theme = useThemeClasses();
  const { updateStock, bulkUpdateInventory } = useInventory();
  const [formData, setFormData] = useState({
    action: 'add',
    quantity: ''
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
      const result = await updateStock(product._id, {
        ...formData,
        quantity: parseInt(formData.quantity)
      });

      if (result.success) {
        onUpdate();
      } else {
        setError(result.error);
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
    switch (formData.action) {
      case 'add': return `Add ${formData.quantity || 0} units to current stock`;
      case 'subtract': return `Remove ${formData.quantity || 0} units from current stock`;
      case 'set': return `Set stock level to ${formData.quantity || 0} units`;
      default: return '';
    }
  };

  const calculateNewQuantity = () => {
    if (!formData.quantity || formData.quantity === '') {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className={`relative mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl transition-colors duration-300 ${theme.card}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
            {`Update Stock - ${product?.name}`}
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Stock Info - Only show for single product update */}
        {!isBulkUpdate && product && (
          <div className={`rounded-xl p-4 mb-6 transition-colors duration-300 ${theme.cardInner}`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={theme.textSecondary}>Current Stock</p>
                <p className={`font-bold text-lg ${theme.textPrimary}`}>{product.quantity} units</p>
              </div>
              <div>
                <p className={theme.textSecondary}>Threshold</p>
                <p className={`font-bold text-lg ${theme.textPrimary}`}>{product.lowStockThreshold} units</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={`mb-4 p-3 rounded-lg border flex items-center gap-3 transition-colors ${theme.isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-700'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${theme.label}`}>
              Action
            </label>
            <select
              name="action"
              value={formData.action}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input} appearance-none`}
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Remove Stock</option>
              <option value="set">Set Stock Level</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${theme.label}`}>
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
              className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
              placeholder="Enter quantity"
            />
          </div>

          {/* Preview */}
          {formData.quantity && (
            <div className={`rounded-xl p-4 border transition-colors duration-300 ${theme.isDark ? 'bg-indigo-900/20 border-indigo-800/40' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${theme.isDark ? 'text-indigo-300' : 'text-blue-800'}`}>Preview</p>
              <p className={`text-sm ${theme.textSecondary}`}>{getActionDescription()}</p>
              <p className={`text-sm mt-1 ${theme.textPrimary}`}>
                New stock level: <span className="font-bold">{calculateNewQuantity()} units</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className={`flex justify-end space-x-3 pt-4 border-t ${theme.divider}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
                theme.isDark 
                  ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 ${
                theme.isDark ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockUpdateModal;