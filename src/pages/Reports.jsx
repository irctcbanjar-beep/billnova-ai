import React, { useState, useEffect } from 'react';
import { Invoice, Expense, Customer, Product } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR } from '../utils/gst';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Download, TrendingUp, TrendingDown, FileText, Receipt, Users, Package } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export default function Reports() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { if (currentBusiness) loadData(); }, [currentBusiness]);

  const loadData = async () => {
    setLoading(true);
    const [inv, exp, cust, prod] = await Promise.all([
      Invoice.filter({ business_id: currentBusiness.id }),
      Expense.filter({ business_id: currentBusiness.id }),
      Customer.filter({ business_id: currentBusiness.id }),
      Product.filter({ business_id: currentBusiness.id }),
    ]);
    setInvoices(inv);
    setExpenses(exp);
    setCustomers(cust);
    setProducts(prod);
    setLoading(false);
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const monthlyData = months.map((month, idx) => {
    const mInv = invoices.filter(i => {
      const d = new Date(i.invoice_date || i.created_date);
      return d.getMonth() === idx && d.getFullYear() === year;
    });
    const mExp = expenses.filter(e => {
      const d = new Date(e.expense_date || e.created_date);
      return d.getMonth() === idx && d.getFullYear() === year;
    });
    const revenue = mInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const expTotal = mExp.reduce((s, e) => s + (e.amount || 0), 0);
    const gst = mInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.tax_total || 0), 0);
    return {
      month, revenue: Math.round(revenue), expenses: Math.round(expTotal),
      profit: Math.round(revenue - expTotal), gst: Math.round(gst),
      invoiceCount: mInv.length,
    };
  });

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalGST = monthlyData.reduce((s, m) => s + m.gst, 0);

  // Top customers
  const customerRevenue = customers.map(c => ({
    name: c.name,
    revenue: invoices.filter(i => i.customer_id === c.id && i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0),
    count: invoices.filter(i => i.customer_id === c.id).length,
  })).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Expense by category
  const expCatData = [...new Set(expenses.map(e => e.category))].map(cat => ({
    name: cat, value: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  // GST summary
  const cgstTotal = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.cgst_total || 0), 0);
  const sgstTotal = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.sgst_total || 0), 0);
  const igstTotal = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.igst_total || 0), 0);

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportInvoices = () => {
    const data = invoices.map(i => ({
      'Invoice #': i.invoice_number, 'Date': i.invoice_date, 'Customer': i.customer_name,
      'Status': i.status, 'Subtotal': i.subtotal, 'CGST': i.cgst_total, 'SGST': i.sgst_total,
      'IGST': i.igst_total, 'Total': i.total, 'Payment Mode': i.payment_mode,
    }));
    exportCSV(data, `invoices_${year}.csv`);
  };

  const exportExpenses = () => {
    const data = expenses.map(e => ({
      'Date': e.expense_date, 'Title': e.title, 'Category': e.category,
      'Vendor': e.vendor_name, 'Amount': e.amount, 'Tax': e.tax_amount, 'Payment': e.payment_mode,
    }));
    exportCSV(data, `expenses_${year}.csv`);
  };

  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const tabs = ['overview', 'gst', 'expenses', 'customers'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Reports & Analytics</h1>
          <p className={`text-sm ${textMuted}`}>Financial insights for {currentBusiness?.business_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(+e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}-{y+1}</option>)}
          </select>
          <button onClick={exportInvoices} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-sm hover:bg-indigo-500/30 transition-all">
            <Download className="w-4 h-4" /> Invoices CSV
          </button>
          <button onClick={exportExpenses} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-all">
            <Download className="w-4 h-4" /> Expenses CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl border ${cardBg} w-fit`}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : `${textMuted} hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatINR(totalRevenue), icon: TrendingUp, color: 'indigo', sub: `${year} YTD` },
          { label: 'Total Expenses', value: formatINR(totalExpenses), icon: TrendingDown, color: 'red', sub: `${year} YTD` },
          { label: 'Net Profit', value: formatINR(totalProfit), icon: TrendingUp, color: totalProfit >= 0 ? 'emerald' : 'red', sub: `${((totalProfit / (totalRevenue || 1)) * 100).toFixed(1)}% margin` },
          { label: 'GST Collected', value: formatINR(totalGST), icon: FileText, color: 'yellow', sub: 'Paid invoices only' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-${k.color}-500/20`}>
                <k.icon className={`w-4 h-4 text-${k.color}-400`} />
              </div>
              <span className={`text-xs ${textMuted}`}>{k.label}</span>
            </div>
            <div className={`text-xl font-bold text-${k.color}-400`}>{k.value}</div>
            <div className={`text-xs mt-1 ${textMuted}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
            <h3 className={`font-bold mb-4 ${textMain}`}>Revenue vs Expenses vs Profit — {year}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatINR(v)} contentStyle={{ background: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
              <h3 className={`font-bold mb-4 ${textMain}`}>Top 5 Customers by Revenue</h3>
              {customerRevenue.length === 0 ? (
                <div className={`text-center py-8 ${textMuted}`}><Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No data yet</p></div>
              ) : customerRevenue.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">{i+1}</div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${textMain}`}>{c.name}</div>
                    <div className="w-full bg-gray-700/30 rounded-full h-1.5 mt-1">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${(c.revenue / customerRevenue[0].revenue) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-indigo-400">{formatINR(c.revenue)}</div>
                    <div className={`text-xs ${textMuted}`}>{c.count} invoices</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
              <h3 className={`font-bold mb-4 ${textMain}`}>Expense Breakdown</h3>
              {expCatData.length === 0 ? (
                <div className={`text-center py-8 ${textMuted}`}><Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No expense data</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={expCatData} cx="50%" cy="45%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name.substring(0,8)} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {expCatData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => formatINR(v)} contentStyle={{ background: isDark ? '#1f2937' : '#fff', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GST TAB */}
      {activeTab === 'gst' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'CGST Collected', value: formatINR(cgstTotal), color: 'indigo' },
              { label: 'SGST Collected', value: formatINR(sgstTotal), color: 'purple' },
              { label: 'IGST Collected', value: formatINR(igstTotal), color: 'cyan' },
              { label: 'Total GST', value: formatINR(cgstTotal + sgstTotal + igstTotal), color: 'emerald' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 border ${cardBg}`}>
                <p className={`text-xs ${textMuted} mb-1`}>{s.label}</p>
                <p className={`font-bold text-xl text-${s.color}-400`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
            <h3 className={`font-bold mb-4 ${textMain}`}>Monthly GST Summary — {year}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatINR(v)} contentStyle={{ background: isDark ? '#1f2937' : '#fff', borderRadius: 12 }} />
                <Bar dataKey="gst" name="GST Collected" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
            <div className="p-4 border-b border-gray-800/30 flex justify-between items-center">
              <h3 className={`font-bold ${textMain}`}>GST Invoice Register</h3>
              <button onClick={exportInvoices} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs">
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  <tr>
                    {['Date', 'Invoice #', 'Customer', 'Taxable Amt', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Total'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {invoices.filter(i => i.status === 'Paid').slice(0, 20).map(inv => (
                    <tr key={inv.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2">{inv.invoice_date}</td>
                      <td className="px-4 py-2 text-indigo-400 font-mono">{inv.invoice_number}</td>
                      <td className="px-4 py-2">{inv.customer_name}</td>
                      <td className="px-4 py-2">{formatINR(inv.subtotal)}</td>
                      <td className="px-4 py-2">{formatINR(inv.cgst_total)}</td>
                      <td className="px-4 py-2">{formatINR(inv.sgst_total)}</td>
                      <td className="px-4 py-2">{formatINR(inv.igst_total)}</td>
                      <td className="px-4 py-2 font-medium text-yellow-400">{formatINR(inv.tax_total)}</td>
                      <td className="px-4 py-2 font-bold text-emerald-400">{formatINR(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.filter(i => i.status === 'Paid').length === 0 && (
                <div className={`text-center py-12 ${textMuted}`}>No paid invoices yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
            <h3 className={`font-bold mb-4 ${textMain}`}>Monthly Expense Trend — {year}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="expGradR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatINR(v)} contentStyle={{ background: isDark ? '#1f2937' : '#fff', borderRadius: 12 }} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGradR)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
            <div className="p-4 border-b border-gray-800/30 flex justify-between items-center">
              <h3 className={`font-bold ${textMain}`}>Expense Details</h3>
              <button onClick={exportExpenses} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs">
                <Download className="w-3 h-3" /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  <tr>
                    {['Date', 'Title', 'Category', 'Vendor', 'Amount', 'Payment Mode'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {expenses.slice(0, 25).map(e => (
                    <tr key={e.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-2">{e.expense_date}</td>
                      <td className="px-4 py-2 font-medium">{e.title}</td>
                      <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">{e.category}</span></td>
                      <td className="px-4 py-2">{e.vendor_name || '—'}</td>
                      <td className="px-4 py-2 font-bold text-red-400">{formatINR(e.amount)}</td>
                      <td className="px-4 py-2">{e.payment_mode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && <div className={`text-center py-12 ${textMuted}`}>No expenses recorded</div>}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
            <div className="p-4 border-b border-gray-800/30">
              <h3 className={`font-bold ${textMain}`}>Customer Analytics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  <tr>
                    {['Customer', 'Type', 'Invoices', 'Total Billed', 'Paid', 'Outstanding', 'Last Invoice'].map(h => (
                      <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                  {customers.map(c => {
                    const cInv = invoices.filter(i => i.customer_id === c.id);
                    const billed = cInv.reduce((s, i) => s + (i.total || 0), 0);
                    const paid = cInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
                    const outstanding = cInv.filter(i => ['Pending','Sent','Overdue'].includes(i.status)).reduce((s, i) => s + (i.balance_due || 0), 0);
                    const lastInv = cInv.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date))[0];
                    return (
                      <tr key={c.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">{c.name?.[0]?.toUpperCase()}</div>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{c.customer_type || 'Individual'}</td>
                        <td className="px-4 py-3">{cInv.length}</td>
                        <td className="px-4 py-3 font-medium">{formatINR(billed)}</td>
                        <td className="px-4 py-3 text-emerald-400">{formatINR(paid)}</td>
                        <td className="px-4 py-3"><span className={outstanding > 0 ? 'text-red-400 font-medium' : 'text-gray-500'}>{formatINR(outstanding)}</span></td>
                        <td className="px-4 py-3 text-xs">{lastInv?.invoice_date || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {customers.length === 0 && <div className={`text-center py-12 ${textMuted}`}>No customers yet</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
