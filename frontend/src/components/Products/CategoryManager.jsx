import React, { useState } from 'react';
import { useProducts } from '../../context/ProductContext';

const CategoryManager = ({ onClose, onCategorySelect }) => {
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Manage Categories</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
              placeholder="Enter new category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={actionLoading}
            />
            <button
              type="submit"
              disabled={actionLoading || !newCategory.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className="max-h-64 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Categories ({categories.length})</h4>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No categories found</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <span className="text-sm font-medium text-gray-700">{category}</span>
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

        {/* Debug Info (remove in production) */}
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <p>Categories count: {categories.length}</p>
          <p>Last update: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
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

export default CategoryManager;