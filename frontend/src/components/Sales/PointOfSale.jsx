import React, { useState, useEffect } from 'react';
import { useSales } from '../../context/SalesContext';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import BarcodeScanner from '../Products/BarcodeScanner';

const PointOfSale = () => {
  const {
    cart,
    cartTotals,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    processSale,
    loading
  } = useSales();

  const { products, getProducts, searchByBarcode } = useProducts();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    getProducts({ limit: 50 });
  }, [getProducts]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 10));
    } else {
      setFilteredProducts(products.slice(0, 10));
    }
  }, [products, searchTerm]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setSearchTerm('');
  };

  const handleBarcodeScan = async (barcode) => {
    const result = await searchByBarcode(barcode);
    if (result.success) {
      addToCart(result.data.product, 1);
    }
    setShowBarcodeScanner(false);
  };

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (parseFloat(amountPaid) < cartTotals.total) {
      alert('Amount paid is less than total amount');
      return;
    }

    const saleData = {
      items: cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      })),
      paymentMethod,
      amountPaid: parseFloat(amountPaid),
      customerEmail: customerEmail || undefined
    };

    const result = await processSale(saleData);
    
    if (result.success) {
      // Reset form
      setAmountPaid('');
      setCustomerEmail('');
      setPaymentMethod('cash');
      alert('Sale processed successfully!');
    }
  };

  const calculateChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - cartTotals.total);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Search & Selection */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex space-x-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, barcode, or category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product._id}
                onClick={() => handleAddToCart(product)}
                disabled={product.quantity === 0}
                className={`p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  product.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {product.category}
                </div>
                <div className="text-sm font-semibold text-green-600 mt-1">
                  ${product.price}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Stock: {product.quantity}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Cart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Sale</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items in cart</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.product.name}</div>
                    <div className="text-sm text-gray-500">${item.price} each</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartItem(item.product._id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.quantity}
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-medium text-gray-900 w-16 text-right">
                      ${item.total.toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <button
                  onClick={clearCart}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment</h3>
        
        {/* Totals */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${cartTotals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (8%):</span>
            <span className="font-medium">${cartTotals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>${cartTotals.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile Payment</option>
          </select>
        </div>

        {/* Amount Paid */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Paid
          </label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            min={cartTotals.total}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* Change */}
        {amountPaid && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="flex justify-between font-medium text-green-800">
              <span>Change:</span>
              <span>${calculateChange().toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Customer Email */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Email (Optional)
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="customer@example.com"
          />
        </div>

        {/* Process Sale Button */}
        <button
          onClick={handleProcessSale}
          disabled={loading || cart.length === 0 || !amountPaid || parseFloat(amountPaid) < cartTotals.total}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : `Process Sale - $${cartTotals.total.toFixed(2)}`}
        </button>

        {/* Cashier Info */}
        <div className="mt-4 pt-4 border-t text-sm text-gray-500">
          <p>Cashier: {user?.name}</p>
          <p>Items: {cartTotals.itemsCount}</p>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onClose={() => setShowBarcodeScanner(false)}
          onScan={handleBarcodeScan}
        />
      )}
    </div>
  );
};

export default PointOfSale;