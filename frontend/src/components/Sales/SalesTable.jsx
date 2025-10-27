import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSales } from '../../context/SalesContext';

const SalesTable = ({ 
  sales, 
  filters, 
  pagination, 
  summary,
  onFilterChange, 
  onPageChange,
  onViewSale,
  loading 
}) => {
  const { user } = useAuth();
  const { refundSale } = useSales();
  const [localFilters, setLocalFilters] = useState(filters);
  const [refundingId, setRefundingId] = useState(null);

  // Debug logging to see what data we're receiving
  useEffect(() => {
    console.log('📊 SalesTable received data:', {
      salesCount: sales?.length || 0,
      sales: sales,
      filters: filters,
      pagination: pagination,
      summary: summary, // Check what summary actually contains
      loading: loading
    });
  }, [sales, filters, pagination, summary, loading]);

  // Get today's date for max date validation
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validate date to not be in future
  const validateDate = (dateString) => {
    if (!dateString) return true;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return selectedDate <= today;
  };

  const safeSales = Array.isArray(sales) ? sales : [];

  const handleFilterChange = (key, value) => {
    // Validate date if it's a date field
    if ((key === 'startDate' || key === 'endDate') && value && !validateDate(value)) {
      alert('Cannot select a future date');
      return;
    }

    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRefund = async (saleId) => {
    if (!window.confirm('Are you sure you want to process a refund for this sale?')) {
      return;
    }

    const reason = prompt('Please enter the reason for refund:');
    if (!reason) return;

    setRefundingId(saleId);
    const result = await refundSale(saleId, { reason });
    setRefundingId(null);

    if (result.success) {
      alert('Refund processed successfully');
      // Refresh the list with current filters
      onFilterChange(localFilters);
    } else {
      alert(`Failed to process refund: ${result.error}`);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'mobile': return 'bg-purple-100 text-purple-800';
      case 'refund': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Safe value formatting
  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return `$${num.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString();
  };

  // Calculate summary from sales if summary data is not available
  const calculatedSummary = React.useMemo(() => {
    if (summary && (summary.totalSales !== undefined || summary.totalTransactions !== undefined)) {
      console.log('✅ Using provided summary:', summary);
      return summary;
    }

    // Calculate summary from sales data as fallback
    console.log('🔄 Calculating summary from sales data');
    const calculated = safeSales.reduce((acc, sale) => {
      if (!sale.isRefund) {
        acc.totalSales += sale.total || 0;
        acc.totalTransactions += 1;
        acc.totalTax += sale.tax || 0;
      }
      return acc;
    }, { totalSales: 0, totalTransactions: 0, totalTax: 0 });

    console.log('📈 Calculated summary:', calculated);
    return calculated;
  }, [summary, safeSales]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Summary */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(calculatedSummary.totalSales)}
            </div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(calculatedSummary.totalTransactions)}
            </div>
            <div className="text-sm text-gray-600">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(calculatedSummary.totalTax)}
            </div>
            <div className="text-sm text-gray-600">Total Tax</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                calculatedSummary.totalSales && calculatedSummary.totalTransactions 
                  ? calculatedSummary.totalSales / calculatedSummary.totalTransactions 
                  : 0
              )}
            </div>
            <div className="text-sm text-gray-600">Average Sale</div>
          </div>
        </div>
        
       
      </div>

      {/* Rest of the component remains the same... */}
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              max={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              max={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cashier</label>
            <input
              type="text"
              value={localFilters.cashier || ''}
              onChange={(e) => handleFilterChange('cashier', e.target.value)}
              placeholder="Filter by cashier..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items per page</label>
            <select
              value={localFilters.limit || 10}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Reset Filters Button */}
        {(localFilters.startDate || localFilters.endDate || localFilters.cashier) && (
          <div className="mt-4">
            <button
              onClick={() => {
                const resetFilters = {
                  startDate: '',
                  endDate: '',
                  cashier: '',
                  limit: localFilters.limit,
                  page: 1
                };
                setLocalFilters(resetFilters);
                onFilterChange(resetFilters);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sale Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cashier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeSales.map((sale) => (
              <tr key={sale._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {sale.saleNumber || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(sale.createdAt)}
                    </div>
                    {sale.customerEmail && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">
                        {sale.customerEmail}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {sale.items?.length || 0} items
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-xs">
                    {sale.items?.slice(0, 2).map(item => item.product?.name || 'Unknown Product').join(', ')}
                    {sale.items?.length > 2 && '...'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(sale.total)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Sub: {formatCurrency(sale.subtotal)} | Tax: {formatCurrency(sale.tax)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentMethodColor(sale.paymentMethod)}`}>
                    {sale.paymentMethod?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  {sale.isRefund && (
                    <div className="text-xs text-red-600 mt-1">REFUND</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.cashier?.fullname || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onViewSale(sale)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    View
                  </button>
                  {user?.role === 'admin' && !sale.isRefund && (
                    <button
                      onClick={() => handleRefund(sale._id)}
                      disabled={refundingId === sale._id}
                      className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                    >
                      {refundingId === sale._id ? 'Refunding...' : 'Refund'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {safeSales.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {localFilters.startDate || localFilters.endDate || localFilters.cashier 
                ? 'Try adjusting your filters or clear them to see all sales' 
                : 'Get started by processing your first sale in the Point of Sale tab'
              }
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading sales...</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">
                {Math.max(0, (pagination.currentPage - 1) * pagination.limit + 1)}
              </span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalSales)}
              </span> of{' '}
              <span className="font-medium">{pagination.totalSales}</span> sales
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTable;