import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { base44 } from './api/base44Client';
import { BusinessProvider } from './contexts/BusinessContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import Settings from './pages/Settings';
import { Zap } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl mx-auto mb-4 animate-pulse">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">BillNova AI</h1>
        <p className="text-gray-400 text-sm">Loading your billing platform...</p>
        <div className="flex justify-center gap-1 mt-4">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await base44.auth.register({ email, password });
      }
      const user = await base44.auth.login({ email, password });
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">BillNova AI</h1>
          <p className="text-gray-400 mt-1">Smart Billing Platform for Indian Businesses</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-gray-400 text-sm mb-6">{isRegister ? 'Start your free trial today' : 'Sign in to your billing dashboard'}</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="you@business.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>{isRegister ? '🚀 Create Account' : '⚡ Sign In'}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register free"}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {['GST Invoicing', 'AI Insights', 'UPI Payments'].map(f => (
            <div key={f} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-xs">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const u = await base44.auth.me();
      if (u) setUser(u);
    } catch (e) {
      // not logged in
    }
    setLoading(false);
  };

  const handleLogin = (u) => setUser(u);

  const handleLogout = async () => {
    await base44.auth.logout();
    setUser(null);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <ThemeProvider>
      <BusinessProvider>
        <Router>
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/aiinsights" element={<AIInsights />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        </Router>
      </BusinessProvider>
    </ThemeProvider>
  );
}
