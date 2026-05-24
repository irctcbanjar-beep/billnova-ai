import React, { useState, useEffect } from 'react';
import { AIInsight, Invoice, Expense, Product, Customer } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR } from '../utils/gst';
import { Brain, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, Trash2, MessageSquare, ChevronRight } from 'lucide-react';

const INSIGHT_ICONS = {
  'Sales Trend': TrendingUp,
  'Expense Alert': TrendingDown,
  'GST Summary': CheckCircle,
  'Inventory Alert': AlertTriangle,
  'Customer Insight': MessageSquare,
  'Revenue Forecast': TrendingUp,
  'General': Brain,
};

const PRIORITY_STYLES = {
  Critical: 'border-red-500/50 bg-red-500/10',
  High: 'border-orange-500/50 bg-orange-500/10',
  Medium: 'border-yellow-500/50 bg-yellow-500/10',
  Low: 'border-emerald-500/50 bg-emerald-500/10',
};

const PRIORITY_TEXT = {
  Critical: 'text-red-400',
  High: 'text-orange-400',
  Medium: 'text-yellow-400',
  Low: 'text-emerald-400',
};

export default function AIInsights() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '👋 Hi! I\'m your AI billing assistant. Ask me about your sales, GST, expenses, or business trends.' }
  ]);
  const [businessStats, setBusinessStats] = useState({});

  useEffect(() => { if (currentBusiness) { loadInsights(); loadStats(); } }, [currentBusiness]);

  const loadInsights = async () => {
    setLoading(true);
    const data = await AIInsight.filter({ business_id: currentBusiness.id });
    setInsights(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const loadStats = async () => {
    const [invoices, expenses, products, customers] = await Promise.all([
      Invoice.filter({ business_id: currentBusiness.id }),
      Expense.filter({ business_id: currentBusiness.id }),
      Product.filter({ business_id: currentBusiness.id }),
      Customer.filter({ business_id: currentBusiness.id }),
    ]);
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const mInv = invoices.filter(i => {
      const d = new Date(i.invoice_date || i.created_date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const lmInv = invoices.filter(i => {
      const d = new Date(i.invoice_date || i.created_date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    });
    const mRev = mInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const lmRev = lmInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const mExp = expenses.filter(e => {
      const d = new Date(e.expense_date || e.created_date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((s, e) => s + (e.amount || 0), 0);

    setBusinessStats({
      monthRevenue: mRev, lastMonthRevenue: lmRev, revChange: lmRev ? ((mRev - lmRev) / lmRev * 100).toFixed(1) : 0,
      monthExpenses: mExp, profit: mRev - mExp,
      totalInvoices: invoices.length, paidInvoices: invoices.filter(i => i.status === 'Paid').length,
      pendingInvoices: invoices.filter(i => ['Pending','Sent'].includes(i.status)).length,
      overdueInvoices: invoices.filter(i => i.status === 'Overdue').length,
      totalCustomers: customers.length,
      lowStockProducts: products.filter(p => !p.is_service && (p.stock_quantity || 0) <= (p.min_stock_alert || 10)).length,
      totalGST: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.tax_total || 0), 0),
      topExpenseCategory: expenses.length ? Object.entries(expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {})).sort((a,b) => b[1]-a[1])[0]?.[0] : 'None',
      invoices, expenses, products, customers,
    });
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const s = businessStats;
      const newInsights = [];

      // Revenue trend
      const revTrend = parseFloat(s.revChange);
      newInsights.push({
        business_id: currentBusiness.id,
        insight_type: 'Sales Trend',
        title: revTrend >= 0 ? `📈 Revenue up ${Math.abs(revTrend)}% this month!` : `📉 Revenue down ${Math.abs(revTrend)}% vs last month`,
        message: revTrend >= 0
          ? `Great news! Your revenue grew from ${formatINR(s.lastMonthRevenue)} to ${formatINR(s.monthRevenue)} this month. Keep up the momentum by following up with ${s.pendingInvoices} pending invoice(s).`
          : `Revenue dropped from ${formatINR(s.lastMonthRevenue)} to ${formatINR(s.monthRevenue)}. Consider sending reminders for ${s.pendingInvoices} pending invoice(s) worth follow-up.`,
        priority: revTrend >= 0 ? 'Low' : 'High',
        is_read: false,
        data: { monthRevenue: s.monthRevenue, lastMonthRevenue: s.lastMonthRevenue, change: revTrend },
      });

      // Profit margin
      const profitMargin = s.monthRevenue ? ((s.profit / s.monthRevenue) * 100).toFixed(1) : 0;
      newInsights.push({
        business_id: currentBusiness.id,
        insight_type: 'General',
        title: `💰 Profit margin this month: ${profitMargin}%`,
        message: `Revenue: ${formatINR(s.monthRevenue)} | Expenses: ${formatINR(s.monthExpenses)} | Net: ${formatINR(s.profit)}. ${parseFloat(profitMargin) < 20 ? 'Consider reducing expenses to improve margins.' : 'Good profit margin — keep controlling expenses!'}`,
        priority: parseFloat(profitMargin) < 10 ? 'High' : parseFloat(profitMargin) < 20 ? 'Medium' : 'Low',
        is_read: false,
      });

      // Overdue invoices
      if (s.overdueInvoices > 0) {
        newInsights.push({
          business_id: currentBusiness.id,
          insight_type: 'Sales Trend',
          title: `⚠️ ${s.overdueInvoices} overdue invoice(s) need urgent attention`,
          message: `You have ${s.overdueInvoices} overdue invoice(s). Late payments hurt cash flow. Send WhatsApp reminders directly from the Invoices page to recover dues faster.`,
          priority: 'Critical',
          is_read: false,
        });
      }

      // GST insight
      newInsights.push({
        business_id: currentBusiness.id,
        insight_type: 'GST Summary',
        title: `🧾 Total GST collected: ${formatINR(s.totalGST)}`,
        message: `You've collected ${formatINR(s.totalGST)} in GST from paid invoices this financial year. Ensure timely GSTR filing to avoid penalties. Use the Reports → GST tab for detailed breakdowns.`,
        priority: 'Medium',
        is_read: false,
      });

      // Low stock
      if (s.lowStockProducts > 0) {
        newInsights.push({
          business_id: currentBusiness.id,
          insight_type: 'Inventory Alert',
          title: `📦 ${s.lowStockProducts} product(s) running low on stock`,
          message: `${s.lowStockProducts} products are at or below minimum stock levels. Head to Inventory to restock before they run out and impact sales.`,
          priority: 'Medium',
          is_read: false,
        });
      }

      // Top expense category
      if (s.topExpenseCategory !== 'None') {
        newInsights.push({
          business_id: currentBusiness.id,
          insight_type: 'Expense Alert',
          title: `💸 Highest expense category: ${s.topExpenseCategory}`,
          message: `${s.topExpenseCategory} is your top expense category this period. Review if there are opportunities to reduce costs here. Check Reports → Expenses for a full breakdown.`,
          priority: 'Low',
          is_read: false,
        });
      }

      // Customer insight
      newInsights.push({
        business_id: currentBusiness.id,
        insight_type: 'Customer Insight',
        title: `👥 ${s.totalCustomers} customers in your database`,
        message: `You have ${s.totalCustomers} customers with ${s.paidInvoices} paid invoices. ${s.pendingInvoices > 0 ? `${s.pendingInvoices} invoices are still pending — follow up to improve collection efficiency.` : 'All invoices are settled — excellent collection rate!'}`,
        priority: 'Low',
        is_read: false,
      });

      for (const ins of newInsights) {
        await AIInsight.create(ins);
      }
      await loadInsights();
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const markRead = async (id) => {
    await AIInsight.update(id, { is_read: true });
    setInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
  };

  const deleteInsight = async (id) => {
    await AIInsight.delete(id);
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const s = businessStats;
    const q = chatInput.toLowerCase();
    let response = '';

    if (q.includes('revenue') || q.includes('sales')) {
      response = `📊 This month's revenue is ${formatINR(s.monthRevenue)}, ${s.revChange >= 0 ? 'up' : 'down'} ${Math.abs(s.revChange)}% vs last month (${formatINR(s.lastMonthRevenue)}).`;
    } else if (q.includes('expense') || q.includes('cost')) {
      response = `💸 This month's expenses: ${formatINR(s.monthExpenses)}. Top category: ${s.topExpenseCategory}. Net profit: ${formatINR(s.profit)}.`;
    } else if (q.includes('gst') || q.includes('tax')) {
      response = `🧾 Total GST collected from paid invoices: ${formatINR(s.totalGST)}. Use Reports → GST tab for detailed CGST/SGST/IGST breakdown.`;
    } else if (q.includes('invoice') || q.includes('pending')) {
      response = `📄 Total invoices: ${s.totalInvoices}. Paid: ${s.paidInvoices} | Pending: ${s.pendingInvoices} | Overdue: ${s.overdueInvoices}.`;
    } else if (q.includes('stock') || q.includes('inventory')) {
      response = `📦 ${s.lowStockProducts} products are low on stock. Head to Inventory for full details and to adjust quantities.`;
    } else if (q.includes('customer')) {
      response = `👥 You have ${s.totalCustomers} customers. ${s.pendingInvoices} pending invoices outstanding. Send WhatsApp reminders from the Invoices page.`;
    } else if (q.includes('profit')) {
      response = `💰 This month: Revenue ${formatINR(s.monthRevenue)} − Expenses ${formatINR(s.monthExpenses)} = Profit ${formatINR(s.profit)} (${s.monthRevenue ? ((s.profit/s.monthRevenue)*100).toFixed(1) : 0}% margin).`;
    } else if (q.includes('hello') || q.includes('hi')) {
      response = `Hi there! 👋 I can answer questions about your revenue, expenses, GST, invoices, inventory, customers, and profit. What would you like to know?`;
    } else {
      response = `🤔 I can help with: revenue trends, expense analysis, GST summary, invoice status, inventory alerts, customer insights, and profit margins. Try asking "What's my revenue this month?" or "How much GST have I collected?"`;
    }

    setChatMessages(prev => [
      ...prev,
      { role: 'user', text: chatInput },
      { role: 'assistant', text: response },
    ]);
    setChatInput('');
  };

  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `flex-1 px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`;

  const unreadCount = insights.filter(i => !i.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${textMain}`}>AI Insights</h1>
            <p className={`text-sm ${textMuted}`}>{unreadCount} new insights</p>
          </div>
        </div>
        <button onClick={generateInsights} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50">
          {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
          {generating ? 'Analyzing...' : 'Generate Insights'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Revenue (Month)', value: formatINR(businessStats.monthRevenue || 0), trend: businessStats.revChange },
          { label: 'Expenses (Month)', value: formatINR(businessStats.monthExpenses || 0) },
          { label: 'Net Profit (Month)', value: formatINR(businessStats.profit || 0) },
          { label: 'Overdue Invoices', value: businessStats.overdueInvoices || 0, alert: (businessStats.overdueInvoices || 0) > 0 },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${cardBg}`}>
            <p className={`text-xs ${textMuted} mb-1`}>{s.label}</p>
            <p className={`font-bold text-lg ${s.alert ? 'text-red-400' : s.label.includes('Profit') ? ((businessStats.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-indigo-400'}`}>{s.value}</p>
            {s.trend !== undefined && (
              <p className={`text-xs mt-1 ${s.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{s.trend >= 0 ? '▲' : '▼'} {Math.abs(s.trend)}% vs last month</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Feed */}
        <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
          <div className="flex items-center justify-between p-5 border-b border-gray-800/30">
            <h3 className={`font-bold ${textMain}`}>AI-Generated Insights</h3>
            {unreadCount > 0 && <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} new</span>}
          </div>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : insights.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-30" />
                <p className={textMuted}>Click "Generate Insights" to analyze your business data</p>
              </div>
            ) : insights.map(ins => {
              const Icon = INSIGHT_ICONS[ins.insight_type] || Brain;
              return (
                <div key={ins.id} className={`rounded-xl border p-4 transition-all ${PRIORITY_STYLES[ins.priority]} ${ins.is_read ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${PRIORITY_TEXT[ins.priority]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase ${PRIORITY_TEXT[ins.priority]}`}>{ins.priority}</span>
                        <span className={`text-xs ${textMuted}`}>• {ins.insight_type}</span>
                        {!ins.is_read && <span className="w-2 h-2 bg-purple-500 rounded-full ml-auto" />}
                      </div>
                      <p className={`text-sm font-semibold ${textMain} mb-1`}>{ins.title}</p>
                      <p className={`text-xs ${textMuted} leading-relaxed`}>{ins.message}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    {!ins.is_read && (
                      <button onClick={() => markRead(ins.id)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Mark read
                      </button>
                    )}
                    <button onClick={() => deleteInsight(ins.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Chat */}
        <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg flex flex-col`} style={{ minHeight: 500 }}>
          <div className="flex items-center gap-3 p-5 border-b border-gray-800/30">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`font-bold ${textMain}`}>AI Business Assistant</h3>
              <p className={`text-xs ${textMuted}`}>Ask anything about your business</p>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 380 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                    : isDark ? 'bg-gray-800 text-gray-200 rounded-bl-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex flex-wrap gap-2 mb-3">
              {['What\'s my revenue?', 'GST summary', 'Pending invoices', 'Profit this month'].map(q => (
                <button key={q} onClick={() => { setChatInput(q); }}
                  className={`text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all`}>
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Ask about your business..."
                className={inputCls}
              />
              <button onClick={handleChat} disabled={!chatInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
