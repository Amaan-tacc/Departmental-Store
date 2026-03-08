import React, { useState } from 'react';
import { useProducts } from '../../context/ProductContext';
import useThemeClasses from '../../context/useThemeClasses';

const CategoryManager = ({ onClose, onCategorySelect }) => {
  const theme = useThemeClasses();
  const { 
    categories, 
    createCategory, 
    deleteCategory, 
    loading, 
    error,
    clearError 
  } = useProducts();
  
  const [newCategory, setNewCategory] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setActionLoading(true);
    clearError(); // Clear previous errors
    
    try {
      const result = await createCategory(newCategory.trim());
      
      if (result.success) {
        setNewCategory('');
        console.log('Category created successfully:', result.data);
        // Don't call getCategories() here - the createCategory function should update the state
      } else {
        console.error('Failed to create category:', result.error);
      }
    } catch (err) {
      console.error('Create category error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    setDeletingCategory(categoryName);
    clearError(); // Clear previous errors
    
    try {
      const result = await deleteCategory(categoryName);
      
      if (!result.success) {
        console.error('Failed to delete category:', result.error);
      }
    } catch (err) {
      console.error('Delete category error:', err);
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleCategorySelect = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className={`relative mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl transition-colors duration-300 ${theme.card}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Manage Categories</h3>
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

        {/* Add Category Form */}
        <form onSubmit={handleCreateCategory} className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                if (error) clearError();
              }}
              placeholder="Enter category name"
              className={`flex-1 px-4 py-2.5 rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme.input}`}
              disabled={actionLoading}
            />
            <button
              type="submit"
              disabled={actionLoading || !newCategory.trim()}
              className={`px-6 py-2.5 rounded-lg font-semibold text-white transition-all duration-200 ${
                theme.isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {actionLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          <h4 className={`text-sm font-semibold uppercase tracking-wider ${theme.textSecondary} mb-4`}>Existing Categories ({categories.length})</h4>
          {categories.length === 0 ? (
            <p className={`text-sm ${theme.textMuted} text-center py-4`}>No categories found</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors duration-200 ${theme.cardInner}`}
                >
                  <span className={`text-sm font-bold ${theme.textPrimary}`}>{category}</span>
                  <div className="flex space-x-2">
                    {onCategorySelect && (
                      <button
                        onClick={() => handleCategorySelect(category)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deletingCategory === category || loading}
                      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                    >
                      {deletingCategory === category ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Info */}
        <div className={`mt-6 p-3 rounded-lg flex items-center justify-between text-[10px] uppercase tracking-widest font-bold ${theme.isDark ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
          <span>Count: {categories.length}</span>
          <span>Sync: {new Date().toLocaleTimeString()}</span>
        </div>

        {/* Actions */}
        <div className={`flex justify-end space-x-3 pt-6 mt-6 border-t ${theme.divider}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 ${
              theme.isDark 
                ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;