import React, { useState, useEffect } from 'react';
import { Product, Supplier } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR } from '../utils/gst';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Tag } from 'lucide-react';

const emptyForm = { name: '', sku: '', barcode: '', description: '', category: '', unit: 'Pcs', purchase_price: 0, selling_price: 0, mrp: 0, tax_percent: 18, hsn_sac_code: '', stock_quantity: 0, min_stock_alert: 10, supplier_name: '', is_service: false, is_active: true };

export default function Products() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  useEffect(() => { if (currentBusiness) loadData(); }, [currentBusiness]);

  const loadData = async () => {
    setLoading(true);
    const [prods, sups] = await Promise.all([
      Product.filter({ business_id: currentBusiness.id }),
      Supplier.filter({ business_id: currentBusiness.id }),
    ]);
    setProducts(prods);
    setSuppliers(sups);
    setLoading(false);
  };

  const generateSKU = () => {
    const prefix = form.name?.substring(0, 3).toUpperCase() || 'PRD';
    return `${prefix}-${Date.now().toString().slice(-6)}`;
  };

  const handleSave = async () => {
    const data = { ...form, business_id: currentBusiness.id, sku: form.sku || generateSKU() };
    if (selected) await Product.update(selected.id, data);
    else await Product.create(data);
    await loadData();
    setShowForm(false);
    setForm(emptyForm);
    setSelected(null);
  };

  const handleEdit = (p) => { setSelected(p); setForm({ ...emptyForm, ...p }); setShowForm(true); };
  const handleDelete = async (id) => { if (confirm('Delete product?')) { await Product.delete(id); loadData(); } };

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
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
          <h1 className={`text-2xl font-bold ${textMain}`}>Products & Services</h1>
          <p className={`text-sm ${textMuted}`}>{products.length} items</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setSelected(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: products.length },
          { label: 'Services', value: products.filter(p => p.is_service).length },
          { label: 'Low Stock', value: products.filter(p => !p.is_service && p.stock_quantity <= p.min_stock_alert).length },
          { label: 'Inventory Value', value: formatINR(products.reduce((s, p) => s + (p.purchase_price || 0) * (p.stock_quantity || 0), 0)) },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${cardBg}`}>
            <p className={`text-xs ${textMuted} mb-1`}>{s.label}</p>
            <p className={`font-bold text-lg ${textMain}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border ${cardBg}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className={`${inputCls} pl-9`} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${catFilter === cat ? 'bg-indigo-600 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500"><Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No products found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  {['Product', 'SKU', 'Category', 'Price', 'Tax', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {filtered.map(p => {
                  const isLow = !p.is_service && (p.stock_quantity || 0) <= (p.min_stock_alert || 10);
                  return (
                    <tr key={p.id} className={`${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-all`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.is_service ? 'bg-purple-500/20' : 'bg-indigo-500/20'}`}>
                            {p.image_url ? <img src={p.image_url} className="w-9 h-9 rounded-xl object-cover" /> : <Package className={`w-4 h-4 ${p.is_service ? 'text-purple-400' : 'text-indigo-400'}`} />}
                          </div>
                          <div>
                            <div className={`font-medium text-sm ${textMain}`}>{p.name}</div>
                            {p.hsn_sac_code && <div className={`text-xs ${textMuted}`}>HSN: {p.hsn_sac_code}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400">{p.sku}</td>
                      <td className="px-4 py-3"><span className={`text-sm ${textMuted}`}>{p.category || '—'}</span></td>
                      <td className="px-4 py-3">
                        <div className={`font-bold text-sm ${textMain}`}>{formatINR(p.selling_price)}</div>
                        {p.mrp && p.mrp !== p.selling_price && <div className={`text-xs ${textMuted} line-through`}>{formatINR(p.mrp)}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-400">{p.tax_percent}%</td>
                      <td className="px-4 py-3">
                        {p.is_service ? <span className="text-purple-400 text-sm">Service</span> : (
                          <div className={`font-medium text-sm ${isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                            {p.stock_quantity} {p.unit}
                            {isLow && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge label={p.is_active ? 'Active' : 'Inactive'} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setSelected(null); setForm(emptyForm); }} title={selected ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={form.is_service} onChange={e => setForm(f => ({ ...f, is_service: e.target.checked }))} className="w-4 h-4 accent-purple-500" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>This is a Service (no stock tracking)</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Product/Service Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Product name" />
            </div>
            <div>
              <label className={labelCls}>SKU</label>
              <div className="flex gap-2">
                <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className={inputCls} placeholder="Auto-generate" />
                <button onClick={() => setForm(f => ({ ...f, sku: generateSKU() }))} className="px-2 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 text-xs whitespace-nowrap">Auto</button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls} placeholder="Electronics, Clothing..." />
            </div>
            <div>
              <label className={labelCls}>HSN/SAC Code</label>
              <input value={form.hsn_sac_code} onChange={e => setForm(f => ({ ...f, hsn_sac_code: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={inputCls}>
                {['Pcs','Kg','Ltr','Mtr','Box','Pack','Dozen','Pair','Set','Other'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Purchase Price (₹)</label>
              <input type="number" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Selling Price (₹)</label>
              <input type="number" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>MRP (₹)</label>
              <input type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GST Rate (%)</label>
              <select value={form.tax_percent} onChange={e => setForm(f => ({ ...f, tax_percent: +e.target.value }))} className={inputCls}>
                {[0, 0.1, 0.25, 3, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            {!form.is_service && <>
              <div>
                <label className={labelCls}>Opening Stock</label>
                <input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: +e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Min Stock Alert</label>
                <input type="number" value={form.min_stock_alert} onChange={e => setForm(f => ({ ...f, min_stock_alert: +e.target.value }))} className={inputCls} />
              </div>
            </>}
            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} h-16 resize-none`} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium">Save Product</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
