import React, { useState, useEffect } from 'react';
import { Product } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR } from '../utils/gst';
import Modal from '../components/ui/Modal';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Edit, Plus } from 'lucide-react';

export default function Inventory() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedProd, setSelectedProd] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState('add');
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => { if (currentBusiness) loadData(); }, [currentBusiness]);

  const loadData = async () => {
    setLoading(true);
    const data = await Product.filter({ business_id: currentBusiness.id });
    setProducts(data.filter(p => !p.is_service));
    setLoading(false);
  };

  const handleAdjust = async () => {
    if (!selectedProd) return;
    const newQty = adjustType === 'add'
      ? (selectedProd.stock_quantity || 0) + adjustQty
      : Math.max(0, (selectedProd.stock_quantity || 0) - adjustQty);
    await Product.update(selectedProd.id, { stock_quantity: newQty });
    await loadData();
    setShowAdjust(false);
    setSelectedProd(null);
    setAdjustQty(0);
    setAdjustNote('');
  };

  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  const lowStock = products.filter(p => (p.stock_quantity || 0) <= (p.min_stock_alert || 10));
  const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0);
  const totalValue = products.reduce((s, p) => s + (p.purchase_price || 0) * (p.stock_quantity || 0), 0);
  const sellValue = products.reduce((s, p) => s + (p.selling_price || 0) * (p.stock_quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${textMain}`}>Inventory Management</h1>
        <p className={`text-sm ${textMuted}`}>Track stock levels and value</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: products.length, color: 'indigo' },
          { label: 'Low Stock', value: lowStock.length, color: 'orange' },
          { label: 'Out of Stock', value: outOfStock.length, color: 'red' },
          { label: 'Stock Value (Cost)', value: formatINR(totalValue), color: 'emerald' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 border ${cardBg}`}>
            <p className={`text-xs ${textMuted} mb-1`}>{s.label}</p>
            <p className={`font-bold text-lg text-${s.color}-400`}>{s.value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-orange-400">⚠️ Low Stock Alert ({lowStock.length} items)</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {lowStock.map(p => (
              <div key={p.id} className={`rounded-xl p-3 ${isDark ? 'bg-gray-900' : 'bg-white'} border border-orange-500/20`}>
                <div className={`font-medium text-sm ${textMain} truncate`}>{p.name}</div>
                <div className="text-orange-400 text-xs">{p.stock_quantity} {p.unit} remaining</div>
                <div className={`text-xs ${textMuted}`}>Min: {p.min_stock_alert}</div>
                <button
                  onClick={() => { setSelectedProd(p); setAdjustType('add'); setAdjustQty(0); setShowAdjust(true); }}
                  className="mt-2 w-full text-xs py-1 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800/30">
          <h3 className={`font-bold ${textMain}`}>Stock Register</h3>
          <div className={`text-sm ${textMuted}`}>Selling Value: <span className="text-emerald-400 font-bold">{formatINR(sellValue)}</span></div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  {['Product', 'SKU', 'Category', 'Stock', 'Min Alert', 'Cost Price', 'Sell Price', 'Stock Value', 'Status', 'Action'].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {products.map(p => {
                  const isLow = (p.stock_quantity || 0) <= (p.min_stock_alert || 10);
                  const isOut = (p.stock_quantity || 0) === 0;
                  return (
                    <tr key={p.id} className={`${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-all`}>
                      <td className="px-4 py-3">
                        <div className={`font-medium text-sm ${textMain}`}>{p.name}</div>
                        {p.category && <div className={`text-xs ${textMuted}`}>{p.category}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400">{p.sku}</td>
                      <td className="px-4 py-3 text-sm">{p.category || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${isOut ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {p.stock_quantity || 0} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{p.min_stock_alert || 10}</td>
                      <td className="px-4 py-3 text-sm">{formatINR(p.purchase_price)}</td>
                      <td className="px-4 py-3 text-sm">{formatINR(p.selling_price)}</td>
                      <td className="px-4 py-3 font-medium text-sm text-indigo-400">{formatINR((p.purchase_price || 0) * (p.stock_quantity || 0))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${isOut ? 'bg-red-500/20 text-red-400' : isLow ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedProd(p); setAdjustType('add'); setAdjustQty(0); setShowAdjust(true); }}
                          className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg"
                          title="Adjust Stock"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No products with inventory tracking</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock" size="sm">
        {selectedProd && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProd.name}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current: <span className="font-bold text-indigo-400">{selectedProd.stock_quantity || 0} {selectedProd.unit}</span></div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Adjustment Type</label>
              <div className="flex gap-2">
                <button onClick={() => setAdjustType('add')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${adjustType === 'add' ? 'bg-emerald-600 border-emerald-600 text-white' : isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                  <TrendingUp className="w-4 h-4" /> Add Stock
                </button>
                <button onClick={() => setAdjustType('remove')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${adjustType === 'remove' ? 'bg-red-600 border-red-600 text-white' : isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                  <TrendingDown className="w-4 h-4" /> Remove Stock
                </button>
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quantity</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(+e.target.value)} min="0" className={inputCls} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Note (optional)</label>
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Reason for adjustment" className={inputCls} />
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} text-sm`}>
              New Stock: <span className="font-bold text-indigo-400">{adjustType === 'add' ? (selectedProd.stock_quantity || 0) + adjustQty : Math.max(0, (selectedProd.stock_quantity || 0) - adjustQty)} {selectedProd.unit}</span>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAdjust(false)} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
              <button onClick={handleAdjust} className={`px-4 py-2 rounded-xl text-white text-sm font-medium ${adjustType === 'add' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                {adjustType === 'add' ? 'Add Stock' : 'Remove Stock'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
