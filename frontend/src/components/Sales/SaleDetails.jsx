import React from 'react';

const SaleDetails = ({ sale, onClose }) => {
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
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'mobile': return 'bg-purple-100 text-purple-800';
      case 'refund': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Sale Details - {sale.saleNumber}</h3>
            <p className="text-gray-600 mt-1">{formatDate(sale.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Items */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Items Sold</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {sale.items.map((item, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.product?.name || 'Product Not Found'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.product?.barcode && `Barcode: ${item.product.barcode}`}
                          {item.product?.category && ` • ${item.product.category}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${item.total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
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
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Payment Information</h4>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(sale.paymentMethod)}`}>
                    {sale.paymentMethod.toUpperCase()}
                  </span>
                </div>
                {sale.isRefund && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Reason:</span>
                    <span className="text-red-600 font-medium">{sale.refundReason}</span>
                  </div>
                )}
                {sale.originalSale && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Sale:</span>
                    <span className="font-medium">{sale.originalSale}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Sale Summary</h4>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${sale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">${sale.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total:</span>
                  <span>${sale.total.toFixed(2)}</span>
                </div>
                {sale.amountPaid && (
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">${sale.amountPaid.toFixed(2)}</span>
                  </div>
                )}
                {sale.change !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Change:</span>
                    <span className="font-medium text-green-600">${sale.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cashier Info */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Cashier Information</h4>
              </div>
              <div className="p-6 space-y-2">
                <div>
                  <span className="text-gray-600">Cashier:</span>
                  <div className="font-medium text-gray-900">{sale.cashier?.fullname || 'N/A'}</div>
                </div>
                {sale.cashier?.email && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <div className="text-sm text-gray-900">{sale.cashier.email}</div>
                  </div>
                )}
                {sale.customerEmail && (
                  <div>
                    <span className="text-gray-600">Customer Email:</span>
                    <div className="text-sm text-gray-900">{sale.customerEmail}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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