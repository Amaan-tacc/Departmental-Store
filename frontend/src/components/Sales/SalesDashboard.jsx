// src/components/Sales/SalesDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSales } from '../../context/SalesContext';
import { useAuth } from '../../context/AuthContext';
import useThemeClasses from '../../context/useThemeClasses';
import { useSocket } from '../../context/SocketContext';
import { useCallback } from 'react';
import SalesTable from './SalesTable';
import SaleDetails from './SaleDetails';
import TodaySummary from './TodaySummary';
import PointOfSale from './PointOfSale';

const SalesDashboard = () => {
  const { 
    sales, 
    getSales, 
    loading, 
    error,
    pagination,
    summary,
    clearError 
  } = useSales();
  
  const { socket, isConnected } = useSocket();
  
  const { user } = useAuth();
  const theme = useThemeClasses();
  const [activeTab, setActiveTab] = useState('pos');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    startDate: '',
    endDate: '',
    cashier: ''
  });
  const [selectedSale, setSelectedSale] = useState(null);
  const [apiError, setApiError] = useState(null);

  const fetchSales = useCallback((isBackground = false) => {
    // If not active tab and not background refresh, skip
    if (activeTab !== 'history' && !isBackground) return;
    
    getSales(filters).then(result => {
      if (!result.success) {
        if (!isBackground) setApiError(result.error);
      } else {
        setApiError(null);
      }
    });
  }, [getSales, activeTab, filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      const handleUpdate = (data) => {
        console.log('Real-time history refresh triggered', data);
        // Small delay to ensure DB has committed and indexed the new sale
        setTimeout(() => fetchSales(true), 500);
      };

      socket.on('saleProcessed', handleUpdate);
      socket.on('saleRefunded', handleUpdate);

      return () => {
        socket.off('saleProcessed', handleUpdate);
        socket.off('saleRefunded', handleUpdate);
      };
    }
  }, [socket, isConnected, fetchSales]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
  };

  const handleCloseSaleDetails = () => {
    setSelectedSale(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      getSales(filters);
    }
  };

  const handleRetry = () => {
    getSales(filters);
  };

  if (loading && sales.length === 0 && activeTab !== 'pos') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className={`ml-3 ${theme.textSecondary}`}>Loading sales data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${theme.card} rounded-lg shadow-sm border p-6 transition-colors duration-300`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>Sales Management</h1>
            <p className={`${theme.textSecondary} mt-1`}>Process sales and manage transactions</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(error || apiError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-red-800 font-medium">Error loading sales:</span>
                <span className="text-red-700 ml-2">{error || apiError}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRetry}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
              <button
                onClick={clearError}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Summary */}
      <TodaySummary />

      {/* Tabs */}
      <div className={`${theme.card} rounded-lg shadow-sm border overflow-hidden transition-colors duration-300`}>
        <div className={`border-b ${theme.divider}`}>
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange('pos')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'pos'
                  ? theme.tabActive
                  : theme.tabInactive
              }`}
            >
              Point of Sale
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => handleTabChange('history')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'history'
                    ? theme.tabActive
                    : theme.tabInactive
                }`}
              >
                Sales History
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pos' && (
            <PointOfSale />
          )}

          {activeTab === 'history' && (
            <SalesTable
              sales={sales}
              filters={filters}
              pagination={pagination}
              summary={summary}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              onViewSale={handleViewSale}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetails
          sale={selectedSale}
          onClose={handleCloseSaleDetails}
        />
      )}
    </div>
  );
};

export default SalesDashboard;