import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import CategoryManager from './CategoryManager';
import useThemeClasses from '../../context/useThemeClasses';

const ProductForm = ({ product, onClose, onSuccess }) => {
  const theme = useThemeClasses();
  const { createProduct, updateProduct, categories, getCategories } = useProducts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    costPrice: '',
    quantity: '',
    lowStockThreshold: '10',
    barcode: '',
    sku: '',
    supplier: '',
    image: ''
  });
  const [showCategoryManager, setShowCategoryManager] = useState(false); // Add this state

  const isEditing = !!product;

useEffect(() => {
  getCategories();
}, [getCategories]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        brand: product.brand || '',
        price: product.price?.toString() || '',
        costPrice: product.costPrice?.toString() || '',
        quantity: product.quantity?.toString() || '',
        lowStockThreshold: product.lowStockThreshold?.toString() || '10',
        barcode: product.barcode || '',
        sku: product.sku || '',
        supplier: product.supplier || '',
        image: product.image || ''
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.brand || !formData.price || !formData.costPrice) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Convert numeric fields
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        quantity: parseInt(formData.quantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10
      };

      let result;
      if (isEditing) {
        result = await updateProduct(product._id, submitData);
      } else {
        result = await createProduct(submitData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = () => {
    // Simple barcode generation - in real app, this would call an API
    const randomBarcode = 'BC' + Date.now().toString().slice(-8);
    setFormData(prev => ({ ...prev, barcode: randomBarcode }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className={`relative mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-xl transition-colors duration-300 ${theme.card}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
            {isEditing ? 'Edit Product' : 'Add New Product'}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className={`text-sm font-semibold uppercase tracking-wider ${theme.textSecondary} border-b ${theme.divider} pb-2`}>Basic Information</h4>
              
              <div>
                <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                  placeholder="Enter product description"
                />
              </div>

              {/* Updated Category Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-sm font-medium ${theme.label}`}>
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryManager(true)}
                    className="text-xs text-blue-500 hover:text-blue-400 font-semibold"
                  >
                    Manage Categories
                  </button>
                </div>
          <select
  name="category"
  value={formData.category}
  onChange={handleChange}
  required
  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 appearance-none ${theme.input}`}
>
  <option value="">Select Category</option>
  {categories && categories.map((category) => (
    <option key={category} value={category}>
      {category}
    </option>
  ))}
</select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                  placeholder="Enter brand name"
                />
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="space-y-4">
              <h4 className={`text-sm font-semibold uppercase tracking-wider ${theme.textSecondary} border-b ${theme.divider} pb-2`}>Pricing & Inventory</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                    Cost Price *
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Identifiers */}
              <h4 className={`text-sm font-semibold uppercase tracking-wider ${theme.textSecondary} border-b ${theme.divider} pb-2 mt-2`}>Identifiers</h4>
              
              <div>
                <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                  Barcode
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className={`flex-1 px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                    placeholder="Barcode"
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${theme.isDark ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                  SKU
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                  placeholder="SKU (auto-generated if empty)"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.label} mb-1.5`}>
                  Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Profit Margin Preview */}
          {formData.price && formData.costPrice && (
            <div className={`rounded-xl p-5 border transition-colors duration-300 ${theme.isDark ? 'bg-indigo-900/20 border-indigo-800/40' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-sm font-bold uppercase tracking-wider mb-3 ${theme.isDark ? 'text-indigo-300' : 'text-blue-800'}`}>Profit Preview</p>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <p className={theme.isDark ? 'text-indigo-300/80' : 'text-blue-700'}>Profit:</p>
                  <p className={`text-lg font-bold ${theme.textPrimary}`}>
                    ${(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={theme.isDark ? 'text-indigo-300/80' : 'text-blue-700'}>Margin:</p>
                  <p className={`text-lg font-bold ${theme.textPrimary}`}>
                    {((parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.costPrice) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className={theme.isDark ? 'text-indigo-300/80' : 'text-blue-700'}>Total Value:</p>
                  <p className={`text-lg font-bold ${theme.textPrimary}`}>
                    ${(parseFloat(formData.price) * (parseInt(formData.quantity) || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={`flex justify-end space-x-3 pt-6 border-t ${theme.divider}`}>
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
              {loading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>

        {/* Category Manager Modal */}
        {showCategoryManager && (
          <CategoryManager
            onClose={() => setShowCategoryManager(false)}
            onCategorySelect={(category) => {
              setFormData(prev => ({ ...prev, category }));
              setShowCategoryManager(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductForm;