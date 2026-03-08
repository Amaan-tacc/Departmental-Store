// src/components/Settings/Settings.jsx
import React, { useState } from 'react';
import { Sun, Moon, Monitor, Percent, Store, Save, LucideInfo } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import useThemeClasses from '../../context/useThemeClasses';
import { useAuth } from '../../context/AuthContext';
import { storeAPI } from '../../services/api';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, refreshUser } = useAuth();
  const classes = useThemeClasses();
  const isDark = theme === 'dark';
  const isAdmin = user?.role === 'admin';

  const [storeSettings, setStoreSettings] = useState({
    taxRate: user?.store?.taxRate || 8.0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: name === 'taxRate' ? parseFloat(value) : value
    }));
  };

  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await storeAPI.updateSettings(storeSettings);
      
      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: 'Store settings updated successfully!' });
        await refreshUser(); // Refresh user context to show new store data everywhere
      }
    } catch (error) {
      console.error('Update settings error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update store settings' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-full transition-colors duration-300 ${classes.textPrimary} max-w-4xl mx-auto pb-12`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className={`mt-1 text-sm ${classes.textSecondary}`}>
          Manage your application and store preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appearance Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Monitor size={20} className="text-indigo-500" />
            <h3 className="font-semibold text-lg">Appearance</h3>
          </div>
          
          <div className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${classes.card}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold">Theme Mode</p>
                <p className={`text-xs mt-0.5 ${classes.textSecondary}`}>
                  {isDark ? 'Dark mode is active' : 'Light mode is active'}
                </p>
              </div>

              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-300 ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  {isDark ? (
                    <Moon size={13} className="text-indigo-600" />
                  ) : (
                    <Sun size={13} className="text-amber-500" />
                  )}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['light', 'dark'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => mode !== theme && toggleTheme()}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                    theme === mode
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                      : isDark
                      ? 'border-slate-600 text-slate-400 hover:border-slate-500'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {mode === 'light' ? (
                    <Sun size={16} className={theme === 'light' ? 'text-amber-500' : ''} />
                  ) : (
                    <Moon size={16} className={theme === 'dark' ? 'text-indigo-400' : ''} />
                  )}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  {theme === mode && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Store Settings Section (Admin Only) */}
        {isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Store size={20} className="text-indigo-500" />
              <h3 className="font-semibold text-lg">Store Configuration</h3>
            </div>

            <form 
              onSubmit={handleSaveStoreSettings}
              className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${classes.card}`}
            >
              {message.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-4">

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${classes.textSecondary}`}>
                    Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="taxRate"
                      step="0.01"
                      min="0"
                      max="100"
                      value={storeSettings.taxRate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all pl-10 ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                      }`}
                      placeholder="8.00"
                      required
                    />
                    <Percent size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-[10px] mt-1.5 text-gray-400 px-1 leading-relaxed">
                    This tax rate will be applied to all new sales transactions.
                  </p>
                </div>


                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Save Store Settings
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className={`mt-10 p-4 rounded-xl border flex items-start gap-3 ${
          isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'
        }`}>
          <LucideInfo size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Some settings are restricted to administrators. Contact your manager to update store-wide configurations like tax rates or store information.
          </p>
        </div>
      )}
    </div>
  );
};

export default Settings;
