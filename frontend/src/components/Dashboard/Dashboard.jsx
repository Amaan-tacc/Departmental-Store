// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    lowStockCount: 0,
    todaySales: 0
  });
  const [todaySummary, setTodaySummary] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch today's sales summary
        const todayResponse = await api.get('/sales/today/summary');
        const todayData = todayResponse.data.data;
        
        // Fetch recent sales
        const salesResponse = await api.get('/sales?page=1&limit=5');
        const salesData = salesResponse.data.data;
        
        // Fetch products count and low stock items
        const productsResponse = await api.get('/products?page=1&limit=1');
        const productsData = productsResponse.data.data;
        
        // Fetch low stock products
        const lowStockResponse = await api.get('/products?lowStock=true');
        const lowStockData = lowStockResponse.data.data;

        setTodaySummary(todayData.summary);
        setRecentSales(salesData.sales || []);
        
        setStats({
          totalProducts: productsData.pagination?.totalProducts || 0,
          totalSales: todayData.summary?.totalSales || 0,
          lowStockCount: lowStockData.products?.length || 0,
          todaySales: todayData.summary?.totalSales || 0
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          <i className={`${icon} text-white text-xl`}></i>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
          ) : (
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  );

  const RecentSales = () => (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center">
                <div className="bg-gray-200 p-2 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))
        ) : recentSales.length > 0 ? (
          recentSales.map((sale) => (
            <div key={sale._id} className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <i className="fas fa-cash-register text-green-600"></i>
                </div>
                <div>
                  <p className="font-medium">Sale #{sale.saleNumber}</p>
                  <p className="text-sm text-gray-500">
                    {sale.items?.length || 0} items • ${sale.total?.toFixed(2)}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(sale.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-receipt text-gray-300 text-3xl mb-2"></i>
            <p className="text-gray-500">No recent sales</p>
          </div>
        )}
      </div>
    </div>
  );

  const SalesOverview = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Overview</h3>
      {loading ? (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32 mb-2 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse mx-auto"></div>
          </div>
        </div>
      ) : todaySummary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900">
                ${todaySummary.totalSales?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Transactions</p>
              <p className="text-2xl font-bold text-green-900">
                {todaySummary.totalTransactions || 0}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">Items Sold</p>
              <p className="text-2xl font-bold text-purple-900">
                {todaySummary.totalItems || 0}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Average Sale</p>
              <p className="text-2xl font-bold text-orange-900">
                ${todaySummary.averageSale?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center">
            <i className="fas fa-chart-bar text-gray-300 text-3xl mb-2"></i>
            <p className="text-gray-500">No sales data for today</p>
          </div>
        </div>
      )}
    </div>
  );

  const TopProducts = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button 
          className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          onClick={() => window.location.href = '/pos'}
        >
          <div className="flex items-center">
            <i className="fas fa-cash-register text-blue-600 mr-3"></i>
            <span className="text-blue-800 font-medium">New Sale</span>
          </div>
          <i className="fas fa-chevron-right text-blue-400"></i>
        </button>
        
        <button 
          className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          onClick={() => window.location.href = '/products'}
        >
          <div className="flex items-center">
            <i className="fas fa-boxes text-green-600 mr-3"></i>
            <span className="text-green-800 font-medium">Manage Products</span>
          </div>
          <i className="fas fa-chevron-right text-green-400"></i>
        </button>
        
        <button 
          className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          onClick={() => window.location.href = '/sales'}
        >
          <div className="flex items-center">
            <i className="fas fa-receipt text-purple-600 mr-3"></i>
            <span className="text-purple-800 font-medium">View Sales Report</span>
          </div>
          <i className="fas fa-chevron-right text-purple-400"></i>
        </button>
        
        {stats.lowStockCount > 0 && (
          <button 
            className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            onClick={() => window.location.href = '/products?lowStock=true'}
          >
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-600 mr-3"></i>
              <span className="text-yellow-800 font-medium">
                Low Stock Alert ({stats.lowStockCount})
              </span>
            </div>
            <i className="fas fa-chevron-right text-yellow-400"></i>
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
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
          ) : (
            `Welcome back, ${user?.name || 'User'}!`
          )}
        </h1>
        <p className="text-gray-600 mt-2">
          {loading ? (
            <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
          ) : (
            "Here's what's happening in your store today."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="fas fa-boxes"
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          title="Today's Revenue"
          value={`$${stats.todaySales.toLocaleString()}`}
          icon="fas fa-dollar-sign"
          color="bg-green-500"
          loading={loading}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon="fas fa-exclamation-triangle"
          color="bg-yellow-500"
          loading={loading}
        />
        <StatCard
          title="Today's Transactions"
          value={todaySummary?.totalTransactions || 0}
          icon="fas fa-shopping-cart"
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesOverview />
        <TopProducts />
      </div>

      <RecentSales />
    </div>
  );
};

export default Dashboard;