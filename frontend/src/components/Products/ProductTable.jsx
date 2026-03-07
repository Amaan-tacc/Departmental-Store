// src/components/Products/ProductTable.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import useThemeClasses from '../../context/useThemeClasses';
import CategoryManager from './CategoryManager';
import { toast } from 'react-toastify';

const ProductTable = ({ 
  products, 
  filters, 
  pagination, 
  onFilterChange, 
  onEditProduct, 
  onPageChange,
  loading 
}) => {
  const { user } = useAuth();
  const { deleteProduct, categories, getCategories } = useProducts();
  const theme = useThemeClasses();
  const [localFilters, setLocalFilters] = useState(filters);
  const [deletingId, setDeletingId] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Load categories on component mount
  React.useEffect(() => {
    getCategories();
  }, [getCategories]);

  const safeProducts = Array.isArray(products) ? products : [];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeletingId(productId);
    const result = await deleteProduct(productId);
    setDeletingId(null);

    if (!result.success) {
      toast.error(`Failed to delete product: ${result.error}`);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          {/* Updated Category Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${theme.label}`}>Category</label>
              <button
                type="button"
                onClick={() => setShowCategoryManager(true)}
                className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Manage
              </button>
            </div>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${theme.input}`}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.lowStock}
                onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                className={`rounded h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors ${theme.isDark ? 'bg-slate-700 border-slate-600' : ''}`}
              />
              <span className={`ml-2 text-sm ${theme.textSecondary}`}>Low Stock Only</span>
            </label>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-2`}>Items per page</label>
            <select
              value={localFilters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${theme.input}`}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
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
                Price
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Stock
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Status
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Barcode
              </th>
              {user?.role === 'admin' && (
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`${theme.tableBody} transition-colors duration-300`}>
            {safeProducts.map((product) => (
              <tr key={product._id} className={`transition-colors duration-150 ${theme.tableRowHover}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 ${theme.isDark ? 'bg-slate-600' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <svg className={`w-5 h-5 ${theme.isDark ? 'text-indigo-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-medium ${theme.textPrimary}`}>{product.name}</div>
                      <div className={`text-sm ${theme.textSecondary}`}>{product.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${theme.isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-blue-50 text-indigo-700'}`}>
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${theme.textPrimary}`}>${product.price}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Cost: ${product.costPrice}</div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textPrimary}`}>
                  <div>{product.quantity} units</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Threshold: {product.lowStockThreshold}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getStockStatus(product))}`}>
                    {getStatusText(getStockStatus(product))}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textSecondary}`}>
                  {product.barcode || 'N/A'}
                </td>
                {user?.role === 'admin' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      disabled={deletingId === product._id}
                      className="text-red-500 hover:text-red-400 font-medium disabled:opacity-50 transition-colors"
                    >
                      {deletingId === product._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {safeProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className={`mx-auto h-12 w-12 ${theme.isDark ? 'text-slate-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className={`mt-2 text-sm font-medium ${theme.textPrimary}`}>No products found</h3>
            <p className={`mt-1 text-sm ${theme.textSecondary}`}>
              {filters.search || filters.category || filters.lowStock 
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first product'
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={`px-6 py-4 border-t ${theme.divider} transition-colors duration-300`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${theme.textSecondary}`}>
              Showing <span className={`font-medium ${theme.textPrimary}`}>{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{' '}
              <span className={`font-medium ${theme.textPrimary}`}>
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts)}
              </span> of{' '}
              <span className={`font-medium ${theme.textPrimary}`}>{pagination.totalProducts}</span> products
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  );
};

export default ProductTable;