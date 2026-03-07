// src/components/Settings/Settings.jsx
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import useThemeClasses from '../../context/useThemeClasses';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const classes = useThemeClasses();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-full transition-colors duration-300 ${classes.textPrimary}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className={`mt-1 text-sm ${classes.textSecondary}`}>
          Manage your application preferences
        </p>
      </div>

      {/* Theme Card */}
      <div
        className={`max-w-lg rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${classes.card}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-300 ${
                isDark ? 'bg-indigo-600/30' : 'bg-indigo-50'
              }`}
            >
              <Monitor
                size={22}
                className={isDark ? 'text-indigo-400' : 'text-indigo-600'}
              />
            </span>
            <div>
              <p className="text-sm font-semibold">Appearance</p>
              <p
                className={`text-xs mt-0.5 transition-colors duration-300 ${classes.textSecondary}`}
              >
                {isDark ? 'Dark mode is active' : 'Light mode is active'}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
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

        {/* Mode badges */}
        <div className="mt-6 grid grid-cols-2 gap-3">
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
  );
};

export default Settings;
