// src/components/Inventory/InventoryStats.jsx
import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import useThemeClasses from '../../context/useThemeClasses';

import { useAuth } from '../../context/AuthContext';

const InventoryStats = ({ inventory: propInventory }) => {
  const { inventory: contextInventory, getLowStockAlerts, lowStockAlerts } = useInventory();
  const { user } = useAuth();
  const theme = useThemeClasses();
  
  const inventory = propInventory || contextInventory;

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  useEffect(() => {
    // Calculate stats from inventory
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    
    if (!Array.isArray(inventory)) {
      console.warn('⚠️ Expected inventory to be an array but got:', inventory);
    }
    
    calculateStats(safeInventory);
  }, [inventory]);

  useEffect(() => {
    getLowStockAlerts();
  }, []);

  const calculateStats = (safeInventory) => {
    const totalProducts = safeInventory.length;

    const totalValue = safeInventory.reduce((sum, product) => {
      const price = Number(product.price) || 0;
      const qty = Number(product.quantity) || 0;
      return sum + (price * qty);
    }, 0);

    const lowStockCount = safeInventory.filter(
      (product) => (Number(product.quantity) || 0) < (Number(product.lowStockThreshold) || 10)
    ).length;

    const outOfStockCount = safeInventory.filter(
      (product) => (Number(product.quantity) || 0) === 0
    ).length;

    setStats({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount
    });
  };

  const StatCard = ({ title, value, subtitle, color, textIconColor, icon }) => (
    <div className={`${theme.card} rounded-lg shadow-sm border p-6 transition-colors duration-300`}>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Products"
        value={stats.totalProducts.toLocaleString()}
        color={theme.statBlueBg}
        icon={
          <svg className={`w-6 h-6 ${theme.statBlueText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />

      {user?.role === 'admin' && (
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color={theme.statGreenBg}
          icon={
            <svg className={`w-6 h-6 ${theme.statGreenText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
      )}

      <StatCard
        title="Low Stock"
        value={stats.lowStockCount}
        subtitle={`${Array.isArray(lowStockAlerts) ? lowStockAlerts.length : 0} items need attention`}
        color={theme.statYellowBg}
        icon={
          <svg className={`w-6 h-6 ${theme.isDark ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        }
      />

      <StatCard
        title="Out of Stock"
        value={stats.outOfStockCount}
        color={theme.isDark ? 'bg-red-900/40' : 'bg-red-100'}
        icon={
          <svg className={`w-6 h-6 ${theme.isDark ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
      />
    </div>
  );
};

export default InventoryStats;