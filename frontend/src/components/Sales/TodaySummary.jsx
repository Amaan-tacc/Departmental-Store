// src/components/Sales/TodaySummary.jsx
import React, { useState, useEffect } from 'react';
import { useSales } from '../../context/SalesContext';
import useThemeClasses from '../../context/useThemeClasses';

import { useAuth } from '../../context/AuthContext';

const TodaySummary = () => {
  const { getTodaySummary } = useSales();
  const { user } = useAuth();
  const theme = useThemeClasses();
  const [summaryData, setSummaryData] = useState({
    summary: {
      totalSales: 0,
      totalTransactions: 0,
      totalItems: 0,
      averageSale: 0
    },
    cashierStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getTodaySummary();
        
        if (result.success) {
          setSummaryData(result.data);
        } else {
          setError(result.error || 'Failed to load summary');
        }
      } catch (err) {
        setError('An error occurred while loading summary');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadSummary, 30000);
    return () => clearInterval(interval);
  }, [getTodaySummary]);

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return `$${num.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className={`${theme.card} rounded-lg shadow-sm border p-6 transition-colors duration-300`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className={`h-8 ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded mb-2`}></div>
                <div className={`h-4 ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, color, iconColor, icon }) => (
    <div className={`${theme.card} rounded-lg border p-6 transition-colors duration-300`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-medium ${theme.textSecondary}`}>{title}</p>
          <p className={`text-2xl font-semibold ${theme.textPrimary}`}>{value}</p>
          {subtitle && <p className={`text-sm ${theme.textMuted}`}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}


      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {user?.role === 'admin' && (
          <StatCard
            title="Today's Sales"
            value={formatCurrency(summaryData.summary.totalSales)}
            color={theme.statGreenBg}
            icon={
              <svg className={`w-6 h-6 ${theme.statGreenText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
        )}

        <StatCard
          title="Transactions"
          value={formatNumber(summaryData.summary.totalTransactions)}
          color={theme.statBlueBg}
          icon={
            <svg className={`w-6 h-6 ${theme.statBlueText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <StatCard
          title="Items Sold"
          value={formatNumber(summaryData.summary.totalItems)}
          color={theme.statPurpleBg}
          icon={
            <svg className={`w-6 h-6 ${theme.statPurpleText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />

        {user?.role === 'admin' && (
          <StatCard
            title="Average Sale"
            value={formatCurrency(summaryData.summary.averageSale)}
            color={theme.statOrangeBg}
            icon={
              <svg className={`w-6 h-6 ${theme.statOrangeText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        )}
      </div>

      {/* Cashier Performance */}
      {user?.role === 'admin' && summaryData.cashierStats && summaryData.cashierStats.length > 0 && (
        <div className={`${theme.card} rounded-lg border p-6 transition-colors duration-300`}>
          <h3 className={`text-lg font-medium ${theme.textPrimary} mb-4`}>Cashier Performance Today</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryData.cashierStats.map((cashier, index) => (
              <div key={index} className={`${theme.cardInner} rounded-lg p-4 border transition-colors duration-200`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className={`font-medium ${theme.textPrimary}`}>{cashier.cashierName || 'Unknown Cashier'}</h4>
                    <p className={`text-sm ${theme.textSecondary}`}>{cashier.transactionCount || 0} transactions</p>
                  </div>
                  <span className={`${theme.statGreenBg} ${theme.statGreenText} text-xs font-medium px-2 py-1 rounded-full transition-colors`}>
                    {formatCurrency(cashier.totalSales)}
                  </span>
                </div>
                <div className={`w-full ${theme.isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2`}>
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, ((cashier.totalSales || 0) / (summaryData.summary.totalSales || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Cashier Stats */}
      {(!summaryData.cashierStats || summaryData.cashierStats.length === 0) && !loading && (
        <div className={`${theme.card} rounded-lg border p-6 transition-colors duration-300`}>
          <h3 className={`text-lg font-medium ${theme.textPrimary} mb-4`}>Cashier Performance Today</h3>
          <div className="text-center py-8">
            <svg className={`mx-auto h-12 w-12 ${theme.isDark ? 'text-slate-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className={`mt-2 text-sm ${theme.textSecondary}`}>No sales activity recorded today</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaySummary;