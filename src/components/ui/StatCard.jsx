import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function StatCard({ title, value, icon: Icon, trend, trendValue, gradient, subtitle }) {
  const { isDark } = useTheme();
  const isPositive = trend === 'up';

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'} hover:scale-[1.02] transition-all duration-300`}>
      {/* Gradient blob */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 ${gradient || 'bg-gradient-to-br from-indigo-500 to-purple-600'} blur-2xl translate-x-4 -translate-y-4`} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{title}</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>}
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${gradient || 'bg-gradient-to-br from-indigo-500 to-purple-600'} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
