// src/components/Inventory/InventoryTable.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import useThemeClasses from '../../context/useThemeClasses';

const InventoryTable = ({ inventory, filters, onFilterChange, onStockUpdate, loading }) => {
  const { user } = useAuth();
  const theme = useThemeClasses();
  const [localFilters, setLocalFilters] = useState(filters);

  // Ensure inventory is always an array
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const getStockStatus = (product) => {
    if (product.quantity === 0) return 'out-of-stock';
    if (product.quantity < product.lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock': return theme.isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800';
      case 'low-stock': return theme.isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return theme.isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800';
      default: return theme.isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`${theme.card} rounded-lg shadow-sm border overflow-hidden transition-colors duration-300`}>
      {/* Filters */}
      <div className={`p-6 border-b ${theme.divider}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-2`}>Search</label>
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search products..."
              className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${theme.input}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-2`}>Category</label>
            <input
              type="text"
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="Filter by category..."
              className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${theme.input}`}
            />
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.lowStock}
                onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                className={`rounded h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors ${theme.isDark ? 'bg-slate-700 border-slate-600' : ''}`}
              />
              <span className={`ml-2 text-sm ${theme.textSecondary}`}>Show Low Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${theme.tableDivide}`}>
          <thead className={theme.tableHead}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Product
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Category
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Current Stock
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Low Stock Alert
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Status
              </th>
              {user?.role === 'admin' && (
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`${theme.tableBody} transition-colors duration-300`}>
            {safeInventory.map((product) => (
              <tr key={product._id} className={`transition-colors duration-150 ${theme.tableRowHover}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 ${theme.isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-blue-100 text-indigo-600'} rounded-lg flex items-center justify-center`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-medium ${theme.textPrimary}`}>{product.name}</div>
                      <div className={`text-sm ${theme.textSecondary}`}>{product.barcode}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${theme.isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-blue-50 text-indigo-700'}`}>
                    {product.category}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textPrimary}`}>
                  {product.quantity}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSecondary}`}>
                  {product.lowStockThreshold}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getStockStatus(product))}`}>
                    {getStatusText(getStockStatus(product))}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onStockUpdate(product)}
                      className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                    >
                      Update Stock
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {safeInventory.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className={`mx-auto h-12 w-12 ${theme.isDark ? 'text-slate-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className={`mt-2 text-sm font-medium ${theme.textPrimary}`}>No products found</h3>
            <p className={`mt-1 text-sm ${theme.textSecondary}`}>
              {filters.search || filters.category || filters.lowStock 
                ? 'Try adjusting your filters' 
                : 'Get started by adding some products'
              }
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500`}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTable;