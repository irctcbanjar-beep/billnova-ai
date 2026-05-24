import React, { useState, useEffect } from 'react';
import { Expense } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR } from '../utils/gst';
import Modal from '../components/ui/Modal';
import { Plus, Search, Edit, Trash2, Receipt, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORIES = ['Fuel', 'Electricity', 'Salary', 'Internet', 'Rent', 'Marketing', 'Office Supplies', 'Travel', 'Maintenance', 'GST/Tax', 'Bank Charges', 'Other'];
const CAT_COLORS = { Fuel: '#f59e0b', Electricity: '#eab308', Salary: '#6366f1', Internet: '#06b6d4', Rent: '#8b5cf6', Marketing: '#ec4899', 'Office Supplies': '#10b981', Travel: '#3b82f6', Maintenance: '#f97316', 'GST/Tax': '#ef4444', 'Bank Charges': '#64748b', Other: '#94a3b8' };

const emptyForm = { title: '', amount: 0, category: 'Other', vendor_name: '', expense_date: new Date().toISOString().split('T')[0], payment_mode: 'Cash', tax_amount: 0, is_gst_expense: false, notes: '', status: 'Approved' };

export default function Expenses() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  useEffect(() => { if (currentBusiness) loadData(); }, [currentBusiness]);
  const loadData = async () => {
    setLoading(true);
    const data = await Expense.filter({ business_id: currentBusiness.id });
    setExpenses(data.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date)));
    setLoading(false);
  };

  const handleSave = async () => {
    const data = { ...form, business_id: currentBusiness.id };
    if (selected) await Expense.update(selected.id, data);
    else await Expense.create(data);
    await loadData();
    setShowForm(false); setForm(emptyForm); setSelected(null);
  };

  const handleEdit = (e) => { setSelected(e); setForm({ ...emptyForm, ...e }); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Delete?')) { await Expense.delete(id); loadData(); } };

  const now = new Date();
  const thisMonth = expenses.filter(e => new Date(e.expense_date).getMonth() === now.getMonth() && new Date(e.expense_date).getFullYear() === now.getFullYear());
  const totalThisMonth = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);
  const totalAll = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Chart data by category
  const catData = CATEGORIES.map(cat => ({
    name: cat.length > 8 ? cat.substring(0, 8) + '...' : cat,
    fullName: cat,
    amount: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(d => d.amount > 0);

  // Monthly chart
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthData = months.map((month, idx) => ({
    month,
    amount: expenses.filter(e => new Date(e.expense_date).getMonth() === idx && new Date(e.expense_date).getFullYear() === now.getFullYear()).reduce((s, e) => s + (e.amount || 0), 0),
  }));

  const filtered = expenses.filter(e => {
    const matchS = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.vendor_name?.toLowerCase().includes(search.toLowerCase());
    const matchC = catFilter === 'All' || e.category === catFilter;
    return matchS && matchC;
  });

  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Expenses</h1>
          <p className={`text-sm ${textMuted}`}>{expenses.length} records</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setSelected(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-medium shadow-lg">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'This Month', value: formatINR(totalThisMonth), color: 'red' },
          { label: 'Total All Time', value: formatINR(totalAll), color: 'indigo' },
          { label: 'GST Expenses', value: formatINR(expenses.filter(e => e.is_gst_expense).reduce((s,e) => s+(e.amount||0), 0)), color: 'yellow' },
          { label: 'Pending Approval', value: expenses.filter(e => e.status === 'Pending').length, color: 'orange' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${cardBg}`}>
            <p className={`text-xs ${textMuted} mb-1`}>{s.label}</p>
            <p className={`font-bold text-lg text-${s.color}-400`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
          <h3 className={`font-bold mb-4 ${textMain}`}>Monthly Expenses {now.getFullYear()}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatINR(v)} contentStyle={{ background: isDark ? '#1f2937' : '#fff', borderRadius: 8 }} />
              <Bar dataKey="amount" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`rounded-2xl p-5 border ${cardBg} shadow-lg`}>
          <h3 className={`font-bold mb-4 ${textMain}`}>By Category</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {catData.sort((a,b) => b.amount - a.amount).map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[d.fullName] || '#6366f1' }} />
                <div className="flex-1 text-sm">{d.fullName}</div>
                <div className="font-bold text-sm" style={{ color: CAT_COLORS[d.fullName] || '#6366f1' }}>{formatINR(d.amount)}</div>
              </div>
            ))}
            {catData.length === 0 && <p className={`text-center py-4 ${textMuted}`}>No expenses yet</p>}
          </div>
        </div>
      </div>

      {/* Filters & List */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border ${cardBg}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." className={`${inputCls} pl-9`} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={`${inputCls} max-w-xs`}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No expenses found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  {['Date', 'Title', 'Category', 'Vendor', 'Amount', 'Payment', 'Actions'].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {filtered.map(e => (
                  <tr key={e.id} className={`${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-all`}>
                    <td className="px-4 py-3 text-sm">{e.expense_date}</td>
                    <td className="px-4 py-3">
                      <div className={`font-medium text-sm ${textMain}`}>{e.title}</div>
                      {e.notes && <div className={`text-xs ${textMuted}`}>{e.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: (CAT_COLORS[e.category] || '#6366f1') + '20', color: CAT_COLORS[e.category] || '#6366f1' }}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{e.vendor_name || '—'}</td>
                    <td className="px-4 py-3 font-bold text-red-400">{formatINR(e.amount)}</td>
                    <td className="px-4 py-3 text-sm">{e.payment_mode}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(e)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelected(null); setForm(emptyForm); }} title={selected ? 'Edit Expense' : 'Add Expense'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Expense description" />
            </div>
            <div>
              <label className={labelCls}>Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Payment Mode</label>
              <select value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))} className={inputCls}>
                {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Vendor Name</label>
              <input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tax Amount (₹)</label>
              <input type="number" value={form.tax_amount} onChange={e => setForm(f => ({ ...f, tax_amount: +e.target.value }))} className={inputCls} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_gst_expense} onChange={e => setForm(f => ({ ...f, is_gst_expense: e.target.checked }))} className="w-4 h-4 accent-indigo-500" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>GST Claimable</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} h-16 resize-none`} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-medium">Save Expense</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
