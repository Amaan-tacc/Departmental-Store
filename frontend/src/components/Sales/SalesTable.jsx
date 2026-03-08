import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSales } from '../../context/SalesContext';
import useThemeClasses from '../../context/useThemeClasses';
import { toast } from 'react-toastify';

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
  const theme = useThemeClasses();
  const [localFilters, setLocalFilters] = useState(filters);
  const [refundingId, setRefundingId] = useState(null);

  // Debug logging to see what data we're receiving
  useEffect(() => {
    console.log('📊 SalesTable received data:', {
      salesCount: sales?.length || 0,
      sales: sales,
      filters: filters,
      pagination: pagination,
      summary: summary,
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
      toast.warning('Cannot select a future date');
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
      toast.success('Refund processed successfully');
      // Refresh the list with current filters
      onFilterChange(localFilters);
    } else {
      toast.error(`Failed to process refund: ${result.error}`);
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
      case 'cash': return theme.isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800';
      case 'card': return theme.isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'mobile': return theme.isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800';
      case 'refund': return theme.isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800';
      default: return theme.isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-800';
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
      acc.totalSales += sale.total || 0;
      acc.totalTransactions += (sale.isRefund ? 0 : 1); // Only count actual sales as transactions? 
      // Or maybe count all? Let's count all for now to match backend $sum: 1
      acc.totalTax += sale.tax || 0;
      return acc;
    }, { totalSales: 0, totalTransactions: 0, totalTax: 0 });

    console.log('📈 Calculated summary:', calculated);
    return calculated;
  }, [summary, safeSales]);

  return (
    <div className={`${theme.card} rounded-lg shadow-sm border transition-colors duration-300`}>
      {/* Summary */}
      <div className={`p-6 border-b ${theme.divider} ${theme.isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme.textPrimary}`}>
              {formatCurrency(calculatedSummary.totalSales)}
            </div>
            <div className={`text-sm ${theme.textSecondary}`}>Total Sales</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme.textPrimary}`}>
              {formatNumber(calculatedSummary.totalTransactions)}
            </div>
            <div className={`text-sm ${theme.textSecondary}`}>Transactions</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme.textPrimary}`}>
              {formatCurrency(calculatedSummary.totalTax)}
            </div>
            <div className={`text-sm ${theme.textSecondary}`}>Total Tax</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme.textPrimary}`}>
              {formatCurrency(
                calculatedSummary.totalSales && calculatedSummary.totalTransactions 
                  ? calculatedSummary.totalSales / calculatedSummary.totalTransactions 
                  : 0
              )}
            </div>
            <div className={`text-sm ${theme.textSecondary}`}>Average Sale</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-6 border-b ${theme.divider}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-2`}>Start Date</label>
            <input
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              max={getTodayDate()}
              className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${theme.input} [color-scheme:light] ${theme.isDark ? '[color-scheme:dark]' : ''}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-2`}>End Date</label>
            <input
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              max={getTodayDate()}
              className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${theme.input} [color-scheme:light] ${theme.isDark ? '[color-scheme:dark]' : ''}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-2`}>Cashier</label>
            <input
              type="text"
              value={localFilters.cashier || ''}
              onChange={(e) => handleFilterChange('cashier', e.target.value)}
              placeholder="Filter by cashier..."
              className={`w-full px-3 py-2 border rounded-md transition-colors duration-200 ${theme.input}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.label} mb-2`}>Items per page</label>
            <select
              value={localFilters.limit || 10}
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
              className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 ${theme.isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${theme.tableDivide}`}>
          <thead className={theme.tableHead}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Sale Details
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Items
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Amount
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Payment
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Cashier
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.tableHeadTh}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${theme.tableBody} transition-colors duration-300`}>
            {safeSales.map((sale) => (
              <tr key={sale._id} className={`transition-colors duration-150 ${theme.tableRowHover}`}>
                <td className="px-6 py-4">
                  <div className="min-w-0 max-w-[200px] md:max-w-xs">
                    <div className={`text-sm font-medium ${theme.textPrimary}`}>
                      {sale.saleNumber || 'N/A'}
                    </div>
                    <div className={`text-sm ${theme.textSecondary}`}>
                      {formatDate(sale.createdAt)}
                    </div>
                    {sale.customerEmail && (
                      <div className={`text-xs ${theme.textMuted} truncate hover:whitespace-normal hover:break-all cursor-help`} title={sale.customerEmail}>
                        {sale.customerEmail}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="min-w-0 max-w-[200px] md:max-w-xs">
                    <div className={`text-sm ${theme.textPrimary}`}>
                      {sale.items?.length || 0} items
                    </div>
                    <div className={`text-xs ${theme.textSecondary} truncate hover:whitespace-normal hover:break-words cursor-help`} title={sale.items?.map(item => item.product?.name || item.productId?.name).join(', ')}>
                      {sale.items?.slice(0, 2).map(item => item.product?.name || item.productId?.name || 'Unknown Product').join(', ')}
                      {sale.items?.length > 2 && '...'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${theme.textPrimary}`}>
                    {formatCurrency(sale.total)}
                  </div>
                  <div className={`text-xs ${theme.textSecondary}`}>
                    Sub: {formatCurrency(sale.subtotal)} | Tax: {formatCurrency(sale.tax)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentMethodColor(sale.paymentMethod)}`}>
                    {sale.paymentMethod?.toUpperCase() || 'UNKNOWN'}
                  </span>
                  {sale.isRefund && (
                    <div className="text-xs text-red-500 mt-1 font-bold">REFUND</div>
                  )}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textPrimary}`}>
                  {sale.cashier?.fullname || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => onViewSale(sale)}
                    className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                  >
                    View
                  </button>
                  {user?.role === 'admin' && !sale.isRefund && (
                    <button
                      onClick={() => handleRefund(sale._id)}
                      disabled={refundingId === sale._id}
                      className="text-red-500 hover:text-red-400 font-medium disabled:opacity-50 transition-colors"
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
            <svg className={`mx-auto h-12 w-12 ${theme.isDark ? 'text-slate-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className={`mt-2 text-sm font-medium ${theme.textPrimary}`}>No sales found</h3>
            <p className={`mt-1 text-sm ${theme.textSecondary}`}>
              {localFilters.startDate || localFilters.endDate || localFilters.cashier 
                ? 'Try adjusting your filters or clear them to see all sales' 
                : 'Get started by processing your first sale in the Point of Sale tab'
              }
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500`}></div>
            <span className={`ml-3 text-sm ${theme.textSecondary}`}>Loading sales...</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={`px-6 py-4 border-t ${theme.divider} transition-colors duration-300`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${theme.textSecondary}`}>
              Showing <span className={`font-medium ${theme.textPrimary}`}>
                {Math.max(0, (pagination.currentPage - 1) * pagination.limit + 1)}
              </span> to{' '}
              <span className={`font-medium ${theme.textPrimary}`}>
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalSales)}
              </span> of{' '}
              <span className={`font-medium ${theme.textPrimary}`}>{pagination.totalSales}</span> sales
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <span className={`px-3 py-1 text-sm ${theme.textSecondary}`}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
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
    </div>
  );
};

export default SalesTable;