// src/context/useThemeClasses.js
// Shared hook that returns a set of semantic class tokens based on active theme.
// Import this wherever you need theme-aware Tailwind classes.
import { useTheme } from './ThemeContext';

const useThemeClasses = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,

    // Page / layout backgrounds
    pageBg:      isDark ? 'bg-slate-800'              : 'bg-gray-100',

    // Cards / panels
    card:        isDark ? 'bg-slate-700 border-slate-600'  : 'bg-white border-gray-200',
    cardInner:   isDark ? 'bg-slate-600 border-slate-500'  : 'bg-gray-50 border-gray-100',

    // Text
    textPrimary:   isDark ? 'text-white'      : 'text-gray-900',
    textSecondary: isDark ? 'text-slate-400'  : 'text-gray-600',
    textMuted:     isDark ? 'text-slate-500'  : 'text-gray-500',

    // Table
    tableHead:   isDark ? 'bg-slate-600'                          : 'bg-gray-50',
    tableHeadTh: isDark ? 'text-slate-300'                        : 'text-gray-500',
    tableBody:   isDark ? 'bg-slate-700 divide-slate-600'         : 'bg-white divide-gray-200',
    tableRowHover: isDark ? 'hover:bg-slate-600'                  : 'hover:bg-gray-50',
    tableDivide: isDark ? 'divide-slate-600'                      : 'divide-gray-200',
    tableCellPrimary:   isDark ? 'text-white'     : 'text-gray-900',
    tableCellSecondary: isDark ? 'text-slate-400' : 'text-gray-500',

    // Inputs
    input: isDark
      ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500',
    label: isDark ? 'text-slate-300' : 'text-gray-700',

    // Borders
    border:      isDark ? 'border-slate-600' : 'border-gray-200',
    divider:     isDark ? 'border-slate-600' : 'border-gray-200',

    // Tabs
    tabActive:   'border-blue-500 text-blue-400',
    tabInactive: isDark
      ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',

    // Stat mini-cards (colored accents stay, only the bg pill behind them changes in dark)
    statBlueBg:   isDark ? 'bg-blue-900/40'   : 'bg-blue-50',
    statGreenBg:  isDark ? 'bg-green-900/40'  : 'bg-green-50',
    statPurpleBg: isDark ? 'bg-purple-900/40' : 'bg-purple-50',
    statOrangeBg: isDark ? 'bg-orange-900/40' : 'bg-orange-50',
    statYellowBg: isDark ? 'bg-yellow-900/40' : 'bg-yellow-50',

    statBlueText:   isDark ? 'text-blue-300'   : 'text-blue-600',
    statGreenText:  isDark ? 'text-green-300'  : 'text-green-600',
    statPurpleText: isDark ? 'text-purple-300' : 'text-purple-600',
    statOrangeText: isDark ? 'text-orange-300' : 'text-orange-600',

    statBlueVal:   isDark ? 'text-blue-100'   : 'text-blue-900',
    statGreenVal:  isDark ? 'text-green-100'  : 'text-green-900',
    statPurpleVal: isDark ? 'text-purple-100' : 'text-purple-900',
    statOrangeVal: isDark ? 'text-orange-100' : 'text-orange-900',

    // Quick-action buttons
    btnBlueBg:   isDark ? 'bg-blue-900/40   hover:bg-blue-900/60'   : 'bg-blue-50   hover:bg-blue-100',
    btnGreenBg:  isDark ? 'bg-green-900/40  hover:bg-green-900/60'  : 'bg-green-50  hover:bg-green-100',
    btnPurpleBg: isDark ? 'bg-purple-900/40 hover:bg-purple-900/60' : 'bg-purple-50 hover:bg-purple-100',
    btnYellowBg: isDark ? 'bg-yellow-900/40 hover:bg-yellow-900/60' : 'bg-yellow-50 hover:bg-yellow-100',

    btnBlueText:   isDark ? 'text-blue-300'   : 'text-blue-800',
    btnGreenText:  isDark ? 'text-green-300'  : 'text-green-800',
    btnPurpleText: isDark ? 'text-purple-300' : 'text-purple-800',
    btnYellowText: isDark ? 'text-yellow-300' : 'text-yellow-800',

    // Low-stock alert panel
    alertYellowBg:    isDark ? 'bg-yellow-900/20 border-yellow-700/40' : 'bg-yellow-50 border-yellow-200',
    alertYellowTitle: isDark ? 'text-yellow-300' : 'text-yellow-800',
    alertYellowBadge: isDark ? 'bg-yellow-800/40 text-yellow-200'      : 'bg-yellow-100 text-yellow-800',
    alertYellowItem:  isDark ? 'bg-slate-700 border-yellow-700/30'     : 'bg-white border-yellow-100',
    alertYellowVal:   isDark ? 'text-yellow-300' : 'text-yellow-700',
  };
};

export default useThemeClasses;
