// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import useThemeClasses from '../../context/useThemeClasses';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const theme = useThemeClasses();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSalesToday: 0,
    totalSalesMonth: 0,
    lowStockCount: 0,
    mySalesToday: 0,
    myTransactionsToday: 0
  });
  const [todaySummary, setTodaySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [viewMode, setViewMode] = useState('today'); // 'today' or 'month'
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch summaries in parallel
        const [todayRes, monthRes, salesRes, productsRes, lowStockRes] = await Promise.all([
          api.get('/sales/today/summary'),
          api.get('/sales/monthly/summary'),
          api.get('/sales?page=1&limit=5'),
          api.get('/products?page=1&limit=1'),
          api.get('/products?lowStock=true')
        ]);

        const todayData = todayRes.data.data;
        const monthData = monthRes.data.data;
        const salesData = salesRes.data.data;
        const productsData = productsRes.data.data;
        const lowStockData = lowStockRes.data.data;

        setTodaySummary(todayData.summary);
        setMonthlySummary(monthData.summary);
        setRecentSales(salesData.sales || []);
        
        // Find current user's performance
        const myPerf = todayData.cashierStats?.find(c => c.cashierName === user?.fullname) || { totalSales: 0, transactionCount: 0 };
        
        setStats({
          totalProducts: productsData.pagination?.totalProducts || 0,
          totalSalesToday: todayData.summary?.totalSales || 0,
          totalSalesMonth: monthData.summary?.totalSales || 0,
          lowStockCount: lowStockData.products?.length || 0,
          mySalesToday: myPerf.totalSales || 0,
          myTransactionsToday: myPerf.transactionCount || 0
        });

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, loading }) => (
    <div className={`${theme.card} rounded-lg shadow p-6 border transition-colors duration-300`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          <i className={`${icon} text-white text-xl`}></i>
        </div>
        <div>
          <p className={`text-sm font-medium ${theme.textSecondary}`}>{title}</p>
          {loading ? (
            <div className={`h-8 ${theme.isDark ? 'bg-slate-600' : 'bg-gray-200'} rounded animate-pulse w-20`}></div>
          ) : (
            <p className={`text-2xl font-semibold ${theme.textPrimary}`}>{value}</p>
          )}
        </div>
      </div>
    </div>
  );

  const RecentSales = () => (
    <div className={`${theme.card} rounded-lg shadow p-6 mt-6 border transition-colors duration-300`}>
      <h3 className={`text-lg font-medium ${theme.textPrimary} mb-4`}>Recent Sales</h3>
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`flex items-center justify-between border-b ${theme.divider} pb-3`}>
              <div className="flex items-center">
                <div className={`${theme.isDark ? 'bg-slate-600' : 'bg-gray-200'} p-2 rounded-full mr-3 animate-pulse w-10 h-10`}></div>
                <div>
                  <div className={`h-4 ${theme.isDark ? 'bg-slate-600' : 'bg-gray-200'} rounded w-32 mb-2 animate-pulse`}></div>
                  <div className={`h-3 ${theme.isDark ? 'bg-slate-600' : 'bg-gray-200'} rounded w-24 animate-pulse`}></div>
                </div>
              </div>
              <div className={`h-3 ${theme.isDark ? 'bg-slate-600' : 'bg-gray-200'} rounded w-16 animate-pulse`}></div>
            </div>
          ))
        ) : recentSales.length > 0 ? (
          recentSales.map((sale) => (
            <div key={sale._id} className={`flex items-center justify-between border-b ${theme.divider} pb-3`}>
              <div className="flex items-center">
                <div className={`${theme.isDark ? 'bg-green-900/40' : 'bg-green-100'} p-2 rounded-full mr-3`}>
                  <i className={`fas fa-cash-register ${theme.isDark ? 'text-green-400' : 'text-green-600'}`}></i>
                </div>
                <div>
                  <p className={`font-medium ${theme.textPrimary}`}>Sale #{sale.saleNumber}</p>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    {sale.items?.length || 0} items • ${sale.total?.toFixed(2)}
                  </p>
                </div>
              </div>
              <span className={`text-sm ${theme.textSecondary}`}>
                {new Date(sale.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <i className={`fas fa-receipt ${theme.isDark ? 'text-slate-600' : 'text-gray-300'} text-3xl mb-2`}></i>
            <p className={theme.textSecondary}>No recent sales</p>
          </div>
        )}
      </div>
    </div>
  );

  const SalesOverview = () => {
    const isAdmin = user?.role === 'admin';
    const currentSummary = isAdmin 
      ? (viewMode === 'today' ? todaySummary : monthlySummary)
      : { 
          totalSales: stats.mySalesToday, 
          totalTransactions: stats.myTransactionsToday,
          totalItems: 0, // Not tracked per cashier in this summary response?
          averageSale: stats.myTransactionsToday > 0 ? stats.mySalesToday / stats.myTransactionsToday : 0
        };

    const label = isAdmin 
      ? (viewMode === 'today' ? "Today's Overview" : "Monthly Overview")
      : "My Performance Today";

    return (
      <div className={`${theme.card} rounded-lg shadow p-6 border transition-colors duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-lg font-medium ${theme.textPrimary}`}>{label}</h3>
          {isAdmin && (
            <div className={`flex p-1 ${theme.isDark ? 'bg-slate-800' : 'bg-gray-100'} rounded-lg`}>
              <button
                onClick={() => setViewMode('today')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'today'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : `${theme.textSecondary} hover:text-blue-500`
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : `${theme.textSecondary} hover:text-blue-500`
                }`}
              >
                Month
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className={`h-64 flex items-center justify-center ${theme.cardInner} rounded border`}>
            <div className="text-center">
              <div className={`h-8 ${theme.isDark ? 'bg-slate-500' : 'bg-gray-200'} rounded animate-pulse w-32 mb-2 mx-auto`}></div>
              <div className={`h-4 ${theme.isDark ? 'bg-slate-500' : 'bg-gray-200'} rounded w-48 animate-pulse mx-auto`}></div>
            </div>
          </div>
        ) : currentSummary ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 gap-4">
              <div className={`${theme.statBlueBg} p-4 rounded-lg`}>
                <p className={`text-sm ${theme.statBlueText}`}>Total Revenue</p>
                <p className={`text-2xl font-bold ${theme.statBlueVal}`}>
                  ${currentSummary.totalSales?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className={`${theme.statGreenBg} p-4 rounded-lg`}>
                <p className={`text-sm ${theme.statGreenText}`}>Transactions</p>
                <p className={`text-2xl font-bold ${theme.statGreenVal}`}>
                  {currentSummary.totalTransactions || 0}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`${theme.statPurpleBg} p-4 rounded-lg`}>
                <p className={`text-sm ${theme.statPurpleText}`}>Items Sold</p>
                <p className={`text-2xl font-bold ${theme.statPurpleVal}`}>
                  {currentSummary.totalItems || 0}
                </p>
              </div>
              <div className={`${theme.statOrangeBg} p-4 rounded-lg`}>
                <p className={`text-sm ${theme.statOrangeText}`}>Average Sale</p>
                <p className={`text-2xl font-bold ${theme.statOrangeVal}`}>
                  ${currentSummary.averageSale?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`h-64 flex items-center justify-center ${theme.cardInner} rounded border`}>
            <div className="text-center">
              <i className={`fas fa-chart-bar ${theme.isDark ? 'text-slate-600' : 'text-gray-300'} text-3xl mb-2`}></i>
              <p className={theme.textSecondary}>No sales data for this period</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const QuickActions = () => (
    <div className={`${theme.card} rounded-lg shadow p-6 border transition-colors duration-300`}>
      <h3 className={`text-lg font-medium ${theme.textPrimary} mb-4`}>Quick Actions</h3>
      <div className="space-y-3">
        <button 
          className={`w-full flex items-center justify-between p-3 ${theme.btnBlueBg} rounded-lg transition-colors`}
          onClick={() => window.location.href = '/pos'}
        >
          <div className="flex items-center">
            <i className={`fas fa-cash-register ${theme.isDark ? 'text-blue-400' : 'text-blue-600'} mr-3`}></i>
            <span className={`${theme.btnBlueText} font-medium`}>New Sale</span>
          </div>
          <i className={`fas fa-chevron-right ${theme.isDark ? 'text-blue-500' : 'text-blue-400'}`}></i>
        </button>
        
        <button 
          className={`w-full flex items-center justify-between p-3 ${theme.btnGreenBg} rounded-lg transition-colors`}
          onClick={() => window.location.href = '/products'}
        >
          <div className="flex items-center">
            <i className={`fas fa-boxes ${theme.isDark ? 'text-green-400' : 'text-green-600'} mr-3`}></i>
            <span className={`${theme.btnGreenText} font-medium`}>Manage Products</span>
          </div>
          <i className={`fas fa-chevron-right ${theme.isDark ? 'text-green-500' : 'text-green-400'}`}></i>
        </button>
        
        <button 
          className={`w-full flex items-center justify-between p-3 ${theme.btnPurpleBg} rounded-lg transition-colors`}
          onClick={() => window.location.href = '/sales'}
        >
          <div className="flex items-center">
            <i className={`fas fa-receipt ${theme.isDark ? 'text-purple-400' : 'text-purple-600'} mr-3`}></i>
            <span className={`${theme.btnPurpleText} font-medium`}>View Sales Report</span>
          </div>
          <i className={`fas fa-chevron-right ${theme.isDark ? 'text-purple-500' : 'text-purple-400'}`}></i>
        </button>
        
        {stats.lowStockCount > 0 && (
          <button 
            className={`w-full flex items-center justify-between p-3 ${theme.btnYellowBg} rounded-lg transition-colors`}
            onClick={() => window.location.href = '/products?lowStock=true'}
          >
            <div className="flex items-center">
              <i className={`fas fa-exclamation-triangle ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'} mr-3`}></i>
              <span className={`${theme.btnYellowText} font-medium`}>
                Low Stock Alert ({stats.lowStockCount})
              </span>
            </div>
            <i className={`fas fa-chevron-right ${theme.isDark ? 'text-yellow-500' : 'text-yellow-400'}`}></i>
          </button>
        )}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${theme.card} shadow rounded-lg p-6 border transition-colors duration-300`}>
        <div className={`text-2xl font-bold ${theme.textPrimary}`}>
          {loading ? (
            <div className={`h-8 ${theme.isDark ? 'bg-slate-600' : 'bg-gray-200'} rounded animate-pulse w-64`}></div>
          ) : (
            `Welcome back, ${user?.name || 'User'}!`
          )}
        </div>
        <div className={`${theme.textSecondary} mt-2`}>
          {loading ? (
            <div className={`h-4 ${theme.isDark ? 'bg-slate-600' : 'bg-gray-200'} rounded animate-pulse w-96`}></div>
          ) : (
            "Here's what's happening in your store."
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="fas fa-boxes"
          color="bg-blue-500"
          loading={loading}
        />
        {user?.role === 'admin' ? (
          <>
            <StatCard
              title="Monthly Revenue"
              value={`$${(stats.totalSalesMonth || 0).toLocaleString()}`}
              icon="fas fa-dollar-sign"
              color="bg-green-600"
              loading={loading}
            />
            <StatCard
              title="Today's Revenue"
              value={`$${(stats.totalSalesToday || 0).toLocaleString()}`}
              icon="fas fa-cash-register"
              color="bg-green-500"
              loading={loading}
            />
          </>
        ) : (
          <>
            <StatCard
              title="My Sales Today"
              value={`$${(stats.mySalesToday || 0).toLocaleString()}`}
              icon="fas fa-wallet"
              color="bg-indigo-600"
              loading={loading}
            />
            <StatCard
              title="My Transactions"
              value={stats.myTransactionsToday}
              icon="fas fa-receipt"
              color="bg-indigo-500"
              loading={loading}
            />
          </>
        )}
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon="fas fa-exclamation-triangle"
          color="bg-yellow-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesOverview />
        <QuickActions />
      </div>

      {user?.role === 'admin' && <RecentSales />}
    </div>
  );
};

export default Dashboard;