import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';

const BarcodeScanner = ({ onClose, onScan }) => {
  const { searchByBarcode } = useProducts();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);



  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    await handleBarcodeSearch(barcodeInput.trim());
  };

// src/components/Products/BarcodeScanner.js - Fix the handleBarcodeSearch function
const handleBarcodeSearch = async (barcode) => {
  setLoading(true);
  setError('');
  setScanResult(null);

  try {
    const result = await searchByBarcode(barcode);
    
    if (result.success) {
      setScanResult(result.data.product);
    } else {
      setError(result.error);
    }
  } catch (err) {
    // Handle different error scenarios
    if (err.response?.status === 404) {
      setError('Product not found with this barcode');
    } else {
      setError('Failed to search product');
    }
  } finally {
    setLoading(false);
  }
};

  const handleUseBarcode = () => {
    if (scanResult?.barcode) {
      onScan(scanResult.barcode);
    }
  };

  const handleScanAnother = () => {
    setBarcodeInput('');
    setScanResult(null);
    setError('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Simulate barcode scanner input (in real app, this would use a barcode scanner library)
  const handleKeyPress = (e) => {
    // Auto-submit when Enter is pressed (simulating barcode scanner behavior)
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleBarcodeSearch(barcodeInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Enter barcode manually or use a barcode scanner. Press Enter to search.
          </p>
          
          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode
              </label>
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter barcode or scan..."
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !barcodeInput.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Product'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Product Found</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium">{scanResult.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Brand:</span>
                <span className="text-sm font-medium">{scanResult.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium">{scanResult.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="text-sm font-medium">${scanResult.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Stock:</span>
                <span className="text-sm font-medium">{scanResult.quantity} units</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleUseBarcode}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
              >
                Use This Barcode
              </button>
              <button
                onClick={handleScanAnother}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                Scan Another
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;