// src/components/Sales/SaleDetails.jsx
import React from 'react';
import useThemeClasses from '../../context/useThemeClasses';

const SaleDetails = ({ sale, onClose }) => {
  const theme = useThemeClasses();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 print:bg-white print:static print:p-0">
      <div className={`relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md transition-colors duration-300 print:bg-white print:text-black print:border-0 print:shadow-none print:top-0 print:max-w-none print-receipt ${theme.card}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-medium print:text-black ${theme.textPrimary}`}>Sale Details - {sale.saleNumber}</h3>
            <p className={`mt-1 print:text-gray-600 ${theme.textSecondary}`}>{formatDate(sale.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textPrimary} transition-colors print:hidden print-hidden`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Items */}
          <div className="lg:col-span-2">
            <div className={`border rounded-lg transition-colors duration-300 print:bg-white print:border-gray-200 ${theme.isDark ? 'border-slate-700 bg-slate-800/50' : 'bg-white border-gray-200'}`}>
              <div className={`px-6 py-4 border-b print:border-gray-200 ${theme.divider}`}>
                <h4 className={`text-lg font-medium print:text-black ${theme.textPrimary}`}>Items Sold</h4>
              </div>
              <div className={`divide-y print:divide-gray-200 ${theme.divider}`}>
                {sale.items.map((item, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`font-medium print:text-black ${theme.textPrimary}`}>
                          {item.product?.name || 'Product Not Found'}
                        </div>
                        <div className={`text-sm mt-1 print:text-gray-600 ${theme.textSecondary}`}>
                          {item.product?.barcode && `Barcode: ${item.product.barcode}`}
                          {item.product?.category && ` • ${item.product.category}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium print:text-black ${theme.textPrimary}`}>
                          ${item.total.toFixed(2)}
                        </div>
                        <div className={`text-sm print:text-gray-600 ${theme.textSecondary}`}>
                          {item.quantity} × ${item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sale Summary */}
          <div className="space-y-6">
            {/* Payment Info */}
            <div className={`border rounded-lg transition-colors duration-300 print:bg-white print:border-gray-200 ${theme.isDark ? 'border-slate-700 bg-slate-800/50' : 'bg-white border-gray-200'}`}>
              <div className={`px-6 py-4 border-b print:border-gray-200 ${theme.divider}`}>
                <h4 className={`text-lg font-medium print:text-black ${theme.textPrimary}`}>Payment Information</h4>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className={`print:text-gray-600 ${theme.textSecondary}`}>Payment Method:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(sale.paymentMethod)}`}>
                    {sale.paymentMethod.toUpperCase()}
                  </span>
                </div>
                {sale.isRefund && (
                  <div className="flex justify-between">
                    <span className={`print:text-gray-600 ${theme.textSecondary}`}>Refund Reason:</span>
                    <span className="text-red-600 font-medium">{sale.refundReason}</span>
                  </div>
                )}
                {sale.originalSale && (
                  <div className="flex justify-between">
                    <span className={`print:text-gray-600 ${theme.textSecondary}`}>Original Sale:</span>
                    <span className={`font-medium print:text-black ${theme.textPrimary}`}>{sale.originalSale}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className={`border rounded-lg transition-colors duration-300 print:bg-white print:border-gray-200 ${theme.isDark ? 'border-slate-700 bg-slate-800/50' : 'bg-white border-gray-200'}`}>
              <div className={`px-6 py-4 border-b print:border-gray-200 ${theme.divider}`}>
                <h4 className={`text-lg font-medium print:text-black ${theme.textPrimary}`}>Sale Summary</h4>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className={`print:text-gray-600 ${theme.textSecondary}`}>Subtotal:</span>
                  <span className={`font-medium print:text-black ${theme.textPrimary}`}>${sale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`print:text-gray-600 ${theme.textSecondary}`}>Tax:</span>
                  <span className={`font-medium print:text-black ${theme.textPrimary}`}>${sale.tax.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between text-lg font-bold border-t pt-3 print:border-gray-200 ${theme.divider}`}>
                  <span className={`print:text-black ${theme.textPrimary}`}>Total:</span>
                  <span className={`print:text-black ${theme.textPrimary}`}>${sale.total.toFixed(2)}</span>
                </div>
                {sale.amountPaid && (
                  <div className={`flex justify-between border-t pt-3 print:border-gray-200 ${theme.divider}`}>
                    <span className={`print:text-gray-600 ${theme.textSecondary}`}>Amount Paid:</span>
                    <span className={`font-medium print:text-black ${theme.textPrimary}`}>${sale.amountPaid.toFixed(2)}</span>
                  </div>
                )}
                {sale.change !== undefined && (
                  <div className="flex justify-between">
                    <span className={`print:text-gray-600 ${theme.textSecondary}`}>Change:</span>
                    <span className="font-medium text-green-600">${sale.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cashier Info */}
            <div className={`border rounded-lg transition-colors duration-300 print:bg-white print:border-gray-200 ${theme.isDark ? 'border-slate-700 bg-slate-800/50' : 'bg-white border-gray-200'}`}>
              <div className={`px-6 py-4 border-b print:border-gray-200 ${theme.divider}`}>
                <h4 className={`text-lg font-medium print:text-black ${theme.textPrimary}`}>Cashier Information</h4>
              </div>
              <div className="p-6 space-y-2">
                <div>
                  <span className={`print:text-gray-600 ${theme.textSecondary}`}>Cashier:</span>
                  <div className={`font-medium print:text-black ${theme.textPrimary}`}>{sale.cashier?.fullname || 'N/A'}</div>
                </div>
                {sale.cashier?.email && (
                  <div>
                    <span className={`print:text-gray-600 ${theme.textSecondary}`}>Email:</span>
                    <div className={`text-sm print:text-black ${theme.textPrimary}`}>{sale.cashier.email}</div>
                  </div>
                )}
                {sale.customerEmail && (
                  <div>
                    <span className={`print:text-gray-600 ${theme.textSecondary}`}>Customer Email:</span>
                    <div className={`text-sm print:text-black ${theme.textPrimary}`}>{sale.customerEmail}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex justify-end space-x-3 pt-6 mt-6 border-t print:hidden print-hidden ${theme.divider}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
              theme.isDark 
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetails;