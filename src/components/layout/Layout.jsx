import React from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

export default function Layout({ children, user, onLogout }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
