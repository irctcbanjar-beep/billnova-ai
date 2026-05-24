import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useBusiness } from '../../contexts/BusinessContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, FileText, Package, Receipt, Users, BarChart3,
  Settings, ChevronDown, Building2, Plus, Zap, ShoppingCart,
  Moon, Sun, Bell, LogOut, Menu, X, Brain
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { label: 'Invoices', icon: FileText, page: 'Invoices' },
  { label: 'Customers', icon: Users, page: 'Customers' },
  { label: 'Products', icon: Package, page: 'Products' },
  { label: 'Inventory', icon: ShoppingCart, page: 'Inventory' },
  { label: 'Expenses', icon: Receipt, page: 'Expenses' },
  { label: 'Suppliers', icon: Building2, page: 'Suppliers' },
  { label: 'Reports', icon: BarChart3, page: 'Reports' },
  { label: 'AI Insights', icon: Brain, page: 'AIInsights' },
  { label: 'Settings', icon: Settings, page: 'Settings' },
];

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const { currentBusiness, businesses, switchBusiness } = useBusiness();
  const { isDark, toggleTheme } = useTheme();
  const [bizDropdown, setBizDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (page) => location.pathname.includes(page.toLowerCase());

  const SidebarContent = () => (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} border-r ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      {/* Logo */}
      <div className="p-5 border-b border-gray-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">BillNova</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI Billing Platform</div>
          </div>
        </div>
      </div>

      {/* Business Switcher */}
      {currentBusiness && (
        <div className="p-3">
          <button
            onClick={() => setBizDropdown(!bizDropdown)}
            className={`w-full flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
              {currentBusiness.business_name?.[0]?.toUpperCase() || 'B'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm truncate">{currentBusiness.business_name}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{currentBusiness.subscription_plan || 'Free'}</div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${bizDropdown ? 'rotate-180' : ''}`} />
          </button>
          {bizDropdown && (
            <div className={`mt-1 rounded-xl shadow-xl overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {businesses.map(b => (
                <button
                  key={b.id}
                  onClick={() => { switchBusiness(b); setBizDropdown(false); }}
                  className={`w-full flex items-center gap-2 p-3 hover:bg-indigo-500/10 text-left transition-all ${b.id === currentBusiness?.id ? 'bg-indigo-500/20 text-indigo-400' : ''}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {b.business_name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm">{b.business_name}</span>
                </button>
              ))}
              <Link
                to={createPageUrl('Settings')}
                onClick={() => setBizDropdown(false)}
                className="flex items-center gap-2 p-3 text-indigo-400 hover:bg-indigo-500/10 text-sm border-t border-gray-700/30"
              >
                <Plus className="w-4 h-4" />
                Add Business
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all group ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : ''} group-hover:scale-110 transition-transform`} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.page === 'AIInsights' && (
                <span className="ml-auto text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full">AI</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-sm font-medium">{user?.full_name || user?.email?.split('@')[0]}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.role || 'Owner'}</div>
          </div>
          <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-all`}>
            {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-64 h-full shadow-2xl">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
