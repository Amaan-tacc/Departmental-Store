import React from 'react';
import { useProducts } from '../../context/ProductContext';

const ProductStats = () => {
  const { products } = useProducts();

  const safeProducts = Array.isArray(products) ? products : [];

  const stats = React.useMemo(() => {
    const totalProducts = safeProducts.length;
    
    const totalValue = safeProducts.reduce((sum, product) => {
      return sum + (product.price * (product.quantity || 0));
    }, 0);

    const lowStockCount = safeProducts.filter(
      product => (product.quantity || 0) < (product.lowStockThreshold || 10)
    ).length;

    const outOfStockCount = safeProducts.filter(
      product => (product.quantity || 0) === 0
    ).length;

    const totalProfitMargin = safeProducts.reduce((sum, product) => {
      if (product.costPrice && product.costPrice > 0) {
        return sum + ((product.price - product.costPrice) / product.costPrice * 100);
      }
      return sum;
    }, 0);

    const averageMargin = totalProducts > 0 ? totalProfitMargin / totalProducts : 0;

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      averageMargin
    };
  }, [safeProducts]);

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Products"
        value={stats.totalProducts.toLocaleString()}
        color="bg-blue-100"
        icon={
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />

      <StatCard
        title="Total Value"
        value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        color="bg-green-100"
        icon={
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        }
      />

      <StatCard
        title="Low Stock"
        value={stats.lowStockCount}
        subtitle={`${stats.outOfStockCount} out of stock`}
        color="bg-yellow-100"
        icon={
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        }
      />

      <StatCard
        title="Avg. Margin"
        value={`${stats.averageMargin.toFixed(1)}%`}
        color="bg-purple-100"
        icon={
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
    </div>
  );
};

export default ProductStats;