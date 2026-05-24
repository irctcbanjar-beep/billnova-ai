import React, { useState, useEffect } from 'react';
import { Invoice, Customer, Product, Expense, AIInsight } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import StatCard from '../components/ui/StatCard';
import { formatINR } from '../utils/gst';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  DollarSign, FileText, Users, Package, TrendingUp, AlertTriangle,
  CheckCircle, Clock, XCircle, Zap, Brain, ArrowRight, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (currentBusiness) loadData();
  }, [currentBusiness]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, cust, prod, exp, ins] = await Promise.all([
        Invoice.filter({ business_id: currentBusiness.id }),
        Customer.filter({ business_id: currentBusiness.id }),
        Product.filter({ business_id: currentBusiness.id }),
        Expense.filter({ business_id: currentBusiness.id }),
        AIInsight.filter({ business_id: currentBusiness.id }),
      ]);
      setInvoices(inv);
      setCustomers(cust);
      setProducts(prod);
      setExpenses(exp);
      setInsights(ins.filter(i => !i.is_read).slice(0, 5));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Calculate stats
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const monthInvoices = invoices.filter(inv => {
    const d = new Date(inv.invoice_date || inv.created_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const lastMonthInvoices = invoices.filter(inv => {
    const d = new Date(inv.invoice_date || inv.created_date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const totalRevenue = monthInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
  const lastRevenue = lastMonthInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
  const revenueTrend = lastRevenue ? (((totalRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1) : 0;

  const gstCollected = monthInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.tax_total || 0), 0);
  const pendingCount = invoices.filter(i => ['Pending', 'Sent'].includes(i.status)).length;
  const pendingAmount = invoices.filter(i => ['Pending', 'Sent'].includes(i.status)).reduce((s, i) => s + (i.balance_due || i.total || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.expense_date || e.created_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).reduce((s, e) => s + (e.amount || 0), 0);
  const lowStock = products.filter(p => (p.stock_quantity || 0) <= (p.min_stock_alert || 10));

  // Monthly chart data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = months.map((month, idx) => {
    const monthRevenue = invoices
      .filter(inv => {
        const d = new Date(inv.invoice_date || inv.created_date);
        return d.getMonth() === idx && d.getFullYear() === thisYear && inv.status === 'Paid';
      })
      .reduce((s, i) => s + (i.total || 0), 0);
    const monthExp = expenses
      .filter(e => {
        const d = new Date(e.expense_date || e.created_date);
        return d.getMonth() === idx && d.getFullYear() === thisYear;
      })
      .reduce((s, e) => s + (e.amount || 0), 0);
    return { month, revenue: Math.round(monthRevenue), expenses: Math.round(monthExp) };
  });

  // Invoice status pie
  const statusData = [
    { name: 'Paid', value: invoices.filter(i => i.status === 'Paid').length },
    { name: 'Pending', value: invoices.filter(i => i.status === 'Pending').length },
    { name: 'Overdue', value: invoices.filter(i => i.status === 'Overdue').length },
    { name: 'Draft', value: invoices.filter(i => i.status === 'Draft').length },
  ].filter(d => d.value > 0);

  // Recent invoices
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  const generateAIInsights = async () => {
    setAiLoading(true);
    try {
      const newInsights = [
        {
          business_id: currentBusiness.id,
          insight_type: 'Sales Trend',
          title: revenueTrend >= 0 ? `Revenue up ${revenueTrend}% this month! 🚀` : `Revenue down ${Math.abs(revenueTrend)}% vs last month`,
          message: revenueTrend >= 0
            ? `Your business grew ${revenueTrend}% compared to last month. Total revenue: ${formatINR(totalRevenue)}. Keep up the momentum!`
            : `Revenue dropped ${Math.abs(revenueTrend)}% compared to last month. Consider reaching out to pending customers. ${pendingCount} invoices worth ${formatINR(pendingAmount)} are pending.`,
          priority: revenueTrend >= 0 ? 'Low' : 'High',
          is_read: false,
        },
      ];
      if (overdueCount > 0) {
        newInsights.push({
          business_id: currentBusiness.id,
          insight_type: 'Sales Trend',
          title: `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''} need attention ⚠️`,
          message: `You have ${overdueCount} overdue invoice(s). Send reminders to improve cash flow.`,
          priority: 'High',
          is_read: false,
        });
      }
      if (lowStock.length > 0) {
        newInsights.push({
          business_id: currentBusiness.id,
          insight_type: 'Inventory Alert',
          title: `${lowStock.length} products low on stock 📦`,
          message: `The following products need restocking: ${lowStock.slice(0,3).map(p => p.name).join(', ')}${lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : ''}.`,
          priority: 'Medium',
          is_read: false,
        });
      }
      for (const ins of newInsights) {
        await AIInsight.create(ins);
      }
      setInsights(newInsights);
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMain = isDark ? 'text-white' : 'text-gray-900';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className={textMuted}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
          </h1>
          <p className={textMuted}>{currentBusiness?.business_name} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'} text-sm transition-all`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link to={createPageUrl('Invoices')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg hover:shadow-indigo-500/30 transition-all">
            <FileText className="w-4 h-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value={formatINR(totalRevenue)} icon={DollarSign}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          trend={revenueTrend >= 0 ? 'up' : 'down'} trendValue={`${revenueTrend}% vs last month`} />
        <StatCard title="GST Collected" value={formatINR(gstCollected)} icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          subtitle="This month" />
        <StatCard title="Pending Invoices" value={pendingCount} icon={Clock}
          gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
          subtitle={formatINR(pendingAmount)} />
        <StatCard title="Monthly Expenses" value={formatINR(monthExpenses)} icon={TrendingUp}
          gradient="bg-gradient-to-br from-red-500 to-pink-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={customers.length} icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600" />
        <StatCard title="Total Products" value={products.length} icon={Package}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle}
          gradient="bg-gradient-to-br from-red-600 to-rose-600" />
        <StatCard title="Low Stock Items" value={lowStock.length} icon={AlertTriangle}
          gradient="bg-gradient-to-br from-orange-500 to-amber-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className={`lg:col-span-2 rounded-2xl p-5 border ${cardBg} shadow-lg`}>
          <h3 className={`font-bold text-base mb-4 ${textMain}`}>Revenue vs Expenses — {thisYear}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Pie */}
        <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
          <h3 className={`font-bold text-base mb-4 ${textMain}`}>Invoice Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="45%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No invoices yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <div className={`rounded-2xl border ${cardBg} shadow-lg overflow-hidden`}>
          <div className="flex items-center justify-between p-5 border-b border-gray-800/30">
            <h3 className={`font-bold ${textMain}`}>Recent Invoices</h3>
            <Link to={createPageUrl('Invoices')} className="text-indigo-400 text-sm flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-800/20">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No invoices yet</p>
              </div>
            ) : recentInvoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-4 hover:bg-gray-800/10 transition-all">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${textMain} truncate`}>{inv.customer_name}</div>
                  <div className={`text-xs ${textMuted}`}>{inv.invoice_number} • {new Date(inv.invoice_date || inv.created_date).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${textMain}`}>{formatINR(inv.total)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                    inv.status === 'Overdue' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className={`rounded-2xl border ${cardBg} shadow-lg overflow-hidden`}>
          <div className="flex items-center justify-between p-5 border-b border-gray-800/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h3 className={`font-bold ${textMain}`}>AI Insights</h3>
            </div>
            <button
              onClick={generateAIInsights}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-all"
            >
              {aiLoading ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3 h-3" />}
              {aiLoading ? 'Analyzing...' : 'Generate'}
            </button>
          </div>
          <div className="p-4 space-y-3">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-10 h-10 mx-auto mb-2 text-purple-400 opacity-40" />
                <p className={`text-sm ${textMuted}`}>Click Generate to get AI insights about your business</p>
              </div>
            ) : insights.map((ins, i) => (
              <div key={i} className={`p-3 rounded-xl border ${
                ins.priority === 'High' ? 'bg-red-500/10 border-red-500/20' :
                ins.priority === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <div className={`font-semibold text-sm mb-1 ${
                  ins.priority === 'High' ? 'text-red-400' :
                  ins.priority === 'Medium' ? 'text-yellow-400' : 'text-emerald-400'
                }`}>{ins.title}</div>
                <p className={`text-xs ${textMuted}`}>{ins.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className={`rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-orange-400">Low Stock Alert</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className={`rounded-xl p-3 ${isDark ? 'bg-gray-900' : 'bg-white'} border border-orange-500/20`}>
                <div className={`font-medium text-sm ${textMain} truncate`}>{p.name}</div>
                <div className="text-orange-400 text-xs">{p.stock_quantity} {p.unit} left</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
