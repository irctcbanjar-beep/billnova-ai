import React, { useState, useEffect } from 'react';
import { Supplier, PurchaseOrder } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR } from '../utils/gst';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, ShoppingCart } from 'lucide-react';

const emptyForm = { name: '', phone: '', email: '', gst_number: '', pan_number: '', address: '', city: '', state: '', credit_period_days: 30, notes: '', is_active: true };

export default function Suppliers() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [showPO, setShowPO] = useState(false);
  const [poForm, setPoForm] = useState({ supplier_id: '', supplier_name: '', order_date: new Date().toISOString().split('T')[0], expected_delivery: '', items: [{ product_name: '', quantity: 1, unit: 'Pcs', price: 0, tax_percent: 18, total: 0 }], notes: '', status: 'Draft' });
  const [selectedPO, setSelectedPO] = useState(null);

  useEffect(() => { if (currentBusiness) loadData(); }, [currentBusiness]);

  const loadData = async () => {
    setLoading(true);
    const [sups, poData] = await Promise.all([
      Supplier.filter({ business_id: currentBusiness.id }),
      PurchaseOrder.filter({ business_id: currentBusiness.id }),
    ]);
    setSuppliers(sups);
    setPOs(poData);
    setLoading(false);
  };

  const handleSave = async () => {
    const data = { ...form, business_id: currentBusiness.id };
    if (selected) await Supplier.update(selected.id, data);
    else await Supplier.create(data);
    await loadData(); setShowForm(false); setForm(emptyForm); setSelected(null);
  };

  const handleEdit = (s) => { setSelected(s); setForm({ ...emptyForm, ...s }); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Delete supplier?')) { await Supplier.delete(id); loadData(); } };

  const handleSavePO = async () => {
    const subtotal = poForm.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const tax_total = poForm.items.reduce((s, i) => s + (i.price * i.quantity * (i.tax_percent || 0) / 100), 0);
    const poNum = `PO-${Date.now().toString().slice(-6)}`;
    await PurchaseOrder.create({
      ...poForm, business_id: currentBusiness.id, po_number: poNum,
      subtotal: +subtotal.toFixed(2), tax_total: +tax_total.toFixed(2),
      total: +(subtotal + tax_total).toFixed(2),
    });
    await loadData();
    setShowPO(false);
  };

  const filtered = suppliers.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search));
  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Suppliers</h1>
          <p className={`text-sm ${textMuted}`}>{suppliers.length} suppliers • {pos.length} purchase orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPO(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-lg">
            <ShoppingCart className="w-4 h-4" /> New PO
          </button>
          <button onClick={() => { setForm(emptyForm); setSelected(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className={`flex gap-3 p-4 rounded-xl border ${cardBg}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..." className={`${inputCls} pl-9`} />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-500"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No suppliers yet</p></div>
        ) : filtered.map(s => (
          <div key={s.id} className={`rounded-2xl border ${cardBg} p-5 shadow-lg hover:scale-[1.01] transition-all`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                  {s.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                  <div className={`font-bold ${textMain}`}>{s.name}</div>
                  {s.gst_number && <div className="text-xs text-indigo-400">GST: {s.gst_number}</div>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              {s.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-gray-400" /><span className={textMuted}>{s.phone}</span></div>}
              {s.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-gray-400" /><span className={textMuted}>{s.email}</span></div>}
              {s.city && <div className={`text-xs ${textMuted}`}>📍 {s.city}{s.state ? `, ${s.state}` : ''}</div>}
            </div>
            <div className={`flex justify-between pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div>
                <div className={`text-xs ${textMuted}`}>Credit Period</div>
                <div className={`font-semibold text-sm ${textMain}`}>{s.credit_period_days || 30} days</div>
              </div>
              <div>
                <div className={`text-xs ${textMuted}`}>Outstanding</div>
                <div className={`font-semibold text-sm ${(s.outstanding_balance || 0) > 0 ? 'text-red-400' : 'text-gray-500'}`}>{formatINR(s.outstanding_balance || 0)}</div>
              </div>
              <div>
                <div className={`text-xs ${textMuted}`}>POs</div>
                <div className={`font-semibold text-sm text-indigo-400`}>{pos.filter(p => p.supplier_id === s.id).length}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Orders */}
      {pos.length > 0 && (
        <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
          <div className="p-5 border-b border-gray-800/30">
            <h3 className={`font-bold ${textMain}`}>Purchase Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                <tr>
                  {['PO #', 'Supplier', 'Date', 'Total', 'Status'].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {pos.map(po => (
                  <tr key={po.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 font-mono text-indigo-400">{po.po_number}</td>
                    <td className="px-4 py-3 font-medium">{po.supplier_name}</td>
                    <td className="px-4 py-3">{po.order_date}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{formatINR(po.total)}</td>
                    <td className="px-4 py-3"><Badge label={po.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelected(null); setForm(emptyForm); }} title={selected ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls}>Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>GST Number</label><input value={form.gst_number} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Credit Period (days)</label><input type="number" value={form.credit_period_days} onChange={e => setForm(f => ({ ...f, credit_period_days: +e.target.value }))} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Address</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>State</label><input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} h-16 resize-none`} /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium">Save Supplier</button>
          </div>
        </div>
      </Modal>

      {/* PO Modal */}
      <Modal isOpen={showPO} onClose={() => setShowPO(false)} title="New Purchase Order" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Supplier</label>
              <select value={poForm.supplier_id} onChange={e => {
                const sup = suppliers.find(s => s.id === e.target.value);
                setPoForm(f => ({ ...f, supplier_id: e.target.value, supplier_name: sup?.name || '' }));
              }} className={inputCls}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Order Date</label><input type="date" value={poForm.order_date} onChange={e => setPoForm(f => ({ ...f, order_date: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Expected Delivery</label><input type="date" value={poForm.expected_delivery} onChange={e => setPoForm(f => ({ ...f, expected_delivery: e.target.value }))} className={inputCls} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${textMain}`}>Items</label>
              <button onClick={() => setPoForm(f => ({ ...f, items: [...f.items, { product_name: '', quantity: 1, unit: 'Pcs', price: 0, tax_percent: 18, total: 0 }] }))}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Row</button>
            </div>
            {poForm.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 mb-2">
                <input value={item.product_name} onChange={e => { const ni = [...poForm.items]; ni[idx].product_name = e.target.value; setPoForm(f => ({ ...f, items: ni })); }} className={`${inputCls} col-span-2`} placeholder="Product name" />
                <input type="number" value={item.quantity} onChange={e => { const ni = [...poForm.items]; ni[idx].quantity = +e.target.value; ni[idx].total = ni[idx].price * ni[idx].quantity; setPoForm(f => ({ ...f, items: ni })); }} className={inputCls} placeholder="Qty" />
                <input type="number" value={item.price} onChange={e => { const ni = [...poForm.items]; ni[idx].price = +e.target.value; ni[idx].total = ni[idx].price * ni[idx].quantity; setPoForm(f => ({ ...f, items: ni })); }} className={inputCls} placeholder="Price" />
                <div className={`text-sm font-bold text-emerald-400 flex items-center`}>{formatINR(item.total)}</div>
              </div>
            ))}
          </div>
          <div><label className={labelCls}>Notes</label><textarea value={poForm.notes} onChange={e => setPoForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} h-16 resize-none`} /></div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowPO(false)} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
            <button onClick={handleSavePO} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium">Create PO</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
