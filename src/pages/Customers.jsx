import React, { useState, useEffect } from 'react';
import { Customer, Invoice } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR } from '../utils/gst';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, FileText, TrendingUp } from 'lucide-react';

const emptyForm = { name: '', phone: '', email: '', gst_number: '', pan_number: '', address: '', city: '', state: '', pincode: '', customer_type: 'Individual', credit_limit: 0, notes: '', is_active: true };

export default function Customers() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => { if (currentBusiness) loadData(); }, [currentBusiness]);

  const loadData = async () => {
    setLoading(true);
    const [cust, inv] = await Promise.all([
      Customer.filter({ business_id: currentBusiness.id }),
      Invoice.filter({ business_id: currentBusiness.id }),
    ]);
    setCustomers(cust);
    setInvoices(inv);
    setLoading(false);
  };

  const handleSave = async () => {
    const data = { ...form, business_id: currentBusiness.id };
    if (selected) await Customer.update(selected.id, data);
    else await Customer.create(data);
    await loadData();
    setShowForm(false);
    setForm(emptyForm);
    setSelected(null);
  };

  const handleEdit = (c) => { setSelected(c); setForm({ ...emptyForm, ...c }); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Delete customer?')) { await Customer.delete(id); loadData(); } };

  const getCustomerStats = (custId) => {
    const custInv = invoices.filter(i => i.customer_id === custId);
    const paid = custInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const pending = custInv.filter(i => ['Pending','Sent','Overdue'].includes(i.status)).reduce((s, i) => s + (i.balance_due || 0), 0);
    return { count: custInv.length, paid, pending };
  };

  const filtered = customers.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()));
  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Customers</h1>
          <p className={`text-sm ${textMuted}`}>{customers.length} customers</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setSelected(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className={`flex gap-3 p-4 rounded-xl border ${cardBg}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className={`${inputCls} pl-9`} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No customers found</p>
          </div>
        ) : filtered.map(c => {
          const stats = getCustomerStats(c.id);
          return (
            <div key={c.id} className={`rounded-2xl border ${cardBg} p-5 shadow-lg hover:scale-[1.01] transition-all`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {c.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className={`font-bold ${textMain}`}>{c.name}</div>
                    <Badge label={c.customer_type || 'Individual'} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(c)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                {c.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-gray-400" /><span className={textMuted}>{c.phone}</span></div>}
                {c.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-gray-400" /><span className={textMuted}>{c.email}</span></div>}
                {c.gst_number && <div className="text-xs text-indigo-400 mt-1">GST: {c.gst_number}</div>}
              </div>
              <div className={`grid grid-cols-3 gap-2 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="text-center">
                  <div className={`text-xs ${textMuted}`}>Invoices</div>
                  <div className={`font-bold ${textMain}`}>{stats.count}</div>
                </div>
                <div className="text-center">
                  <div className={`text-xs ${textMuted}`}>Paid</div>
                  <div className="font-bold text-emerald-400 text-sm">{formatINR(stats.paid)}</div>
                </div>
                <div className="text-center">
                  <div className={`text-xs ${textMuted}`}>Pending</div>
                  <div className={`font-bold text-sm ${stats.pending > 0 ? 'text-red-400' : 'text-gray-500'}`}>{formatINR(stats.pending)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setForm(emptyForm); setSelected(null); }} title={selected ? 'Edit Customer' : 'Add Customer'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Customer name" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GST Number</label>
              <input value={form.gst_number} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} className={inputCls} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className={labelCls}>PAN Number</label>
              <input value={form.pan_number} onChange={e => setForm(f => ({ ...f, pan_number: e.target.value }))} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Customer Type</label>
              <select value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))} className={inputCls}>
                {['Individual', 'Business', 'Government'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Credit Limit (₹)</label>
              <input type="number" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: +e.target.value }))} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} h-16 resize-none`} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium">Save Customer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
