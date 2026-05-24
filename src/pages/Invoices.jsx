import React, { useState, useEffect, useRef } from 'react';
import { Invoice, Customer, Product, Business } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatINR, calculateGST, amountInWords, INDIAN_STATES } from '../utils/gst';
import { generateInvoiceHTML } from '../utils/invoiceGenerator';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import {
  Plus, Search, Filter, Download, Send, Eye, Trash2, Edit,
  FileText, ChevronDown, X, Printer, Share2, QrCode, CheckCircle
} from 'lucide-react';

const emptyItem = { product_id: '', product_name: '', hsn_sac: '', description: '', quantity: 1, unit: 'Pcs', price: 0, discount_percent: 0, tax_percent: 18, cgst: 0, sgst: 0, igst: 0, total: 0 };

export default function Invoices() {
  const { currentBusiness } = useBusiness();
  const { isDark } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState({
    customer_id: '', customer_name: '', customer_phone: '', customer_email: '',
    customer_gst: '', customer_address: '', invoice_date: new Date().toISOString().split('T')[0],
    due_date: '', items: [{ ...emptyItem }], notes: '', terms: 'Payment due within 30 days.',
    status: 'Draft', payment_mode: 'Cash', is_interstate: false,
  });
  const previewRef = useRef(null);

  useEffect(() => {
    if (currentBusiness) loadData();
  }, [currentBusiness]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, cust, prod] = await Promise.all([
        Invoice.filter({ business_id: currentBusiness.id }),
        Customer.filter({ business_id: currentBusiness.id }),
        Product.filter({ business_id: currentBusiness.id }),
      ]);
      setInvoices(inv.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setCustomers(cust);
      setProducts(prod);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const calcItem = (item, isInterstate) => {
    const result = calculateGST(item.price, item.quantity, item.tax_percent, item.discount_percent, isInterstate);
    return { ...item, cgst: result.cgst, sgst: result.sgst, igst: result.igst, total: result.total };
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    if (['price', 'quantity', 'tax_percent', 'discount_percent'].includes(field)) {
      newItems[idx] = calcItem(newItems[idx], form.is_interstate);
    }
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[idx] = calcItem({
          ...newItems[idx], product_id: value, product_name: prod.name,
          hsn_sac: prod.hsn_sac_code || '', price: prod.selling_price || 0,
          tax_percent: prod.tax_percent || 18, unit: prod.unit || 'Pcs',
        }, form.is_interstate);
      }
    }
    setForm(f => ({ ...f, items: newItems }));
  };

  const calcTotals = () => {
    const items = form.items;
    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity - (i.price * i.quantity * (i.discount_percent || 0) / 100)), 0);
    const cgst_total = items.reduce((s, i) => s + (i.cgst || 0), 0);
    const sgst_total = items.reduce((s, i) => s + (i.sgst || 0), 0);
    const igst_total = items.reduce((s, i) => s + (i.igst || 0), 0);
    const tax_total = cgst_total + sgst_total + igst_total;
    const total = subtotal + tax_total;
    return { subtotal: +subtotal.toFixed(2), cgst_total: +cgst_total.toFixed(2), sgst_total: +sgst_total.toFixed(2), igst_total: +igst_total.toFixed(2), tax_total: +tax_total.toFixed(2), total: +total.toFixed(2) };
  };

  const generateInvoiceNumber = () => {
    const prefix = currentBusiness?.invoice_prefix || 'INV';
    const counter = (currentBusiness?.invoice_counter || 1);
    return `${prefix}-${String(counter).padStart(4, '0')}`;
  };

  const handleCustomerSelect = (custId) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setForm(f => ({
        ...f, customer_id: custId, customer_name: cust.name,
        customer_phone: cust.phone || '', customer_email: cust.email || '',
        customer_gst: cust.gst_number || '', customer_address: cust.address || '',
      }));
    }
  };

  const handleSave = async (status = 'Draft') => {
    const totals = calcTotals();
    const invoiceNumber = generateInvoiceNumber();
    try {
      const data = {
        ...form, ...totals, business_id: currentBusiness.id,
        invoice_number: invoiceNumber, status,
        balance_due: totals.total, amount_paid: 0,
      };
      if (selectedInvoice) {
        await Invoice.update(selectedInvoice.id, data);
      } else {
        await Invoice.create(data);
      }
      await loadData();
      setShowForm(false);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setForm({
      customer_id: '', customer_name: '', customer_phone: '', customer_email: '',
      customer_gst: '', customer_address: '', invoice_date: new Date().toISOString().split('T')[0],
      due_date: '', items: [{ ...emptyItem }], notes: '', terms: 'Payment due within 30 days.',
      status: 'Draft', payment_mode: 'Cash', is_interstate: false,
    });
    setSelectedInvoice(null);
  };

  const handleEdit = (inv) => {
    setSelectedInvoice(inv);
    setForm({
      customer_id: inv.customer_id || '',
      customer_name: inv.customer_name || '',
      customer_phone: inv.customer_phone || '',
      customer_email: inv.customer_email || '',
      customer_gst: inv.customer_gst || '',
      customer_address: inv.customer_address || '',
      invoice_date: inv.invoice_date || '',
      due_date: inv.due_date || '',
      items: inv.items || [{ ...emptyItem }],
      notes: inv.notes || '',
      terms: inv.terms || '',
      status: inv.status || 'Draft',
      payment_mode: inv.payment_mode || 'Cash',
      is_interstate: inv.is_interstate || false,
    });
    setShowForm(true);
  };

  const handlePreview = (inv) => {
    setSelectedInvoice(inv);
    setShowPreview(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this invoice?')) {
      await Invoice.delete(id);
      loadData();
    }
  };

  const handleMarkPaid = async (inv) => {
    await Invoice.update(inv.id, { status: 'Paid', amount_paid: inv.total, balance_due: 0, payment_date: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handlePrint = () => {
    const html = generateInvoiceHTML(selectedInvoice, currentBusiness);
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const handleWhatsApp = (inv) => {
    const msg = encodeURIComponent(`Dear ${inv.customer_name},\n\nYour invoice ${inv.invoice_number} for ${formatINR(inv.total)} is ready.\nDue date: ${inv.due_date || 'On receipt'}\n\nThank you!\n${currentBusiness?.business_name}`);
    window.open(`https://wa.me/${inv.customer_phone?.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const totals = calcTotals();

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.customer_name?.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Invoices</h1>
          <p className={`text-sm ${textMuted}`}>{invoices.length} total invoices</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg hover:shadow-indigo-500/30 transition-all">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: formatINR(invoices.reduce((s,i)=>s+(i.total||0),0)), color: 'indigo' },
          { label: 'Paid', value: formatINR(invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+(i.total||0),0)), color: 'emerald' },
          { label: 'Pending', value: formatINR(invoices.filter(i=>['Pending','Sent'].includes(i.status)).reduce((s,i)=>s+(i.balance_due||0),0)), color: 'yellow' },
          { label: 'Overdue', value: formatINR(invoices.filter(i=>i.status==='Overdue').reduce((s,i)=>s+(i.balance_due||0),0)), color: 'red' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl p-4 border ${cardBg} shadow`}>
            <p className={`text-xs ${textMuted} mb-1`}>{card.label}</p>
            <p className={`font-bold text-lg text-${card.color}-400`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border ${cardBg}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className={`${inputCls} pl-9`} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Draft', 'Sent', 'Paid', 'Pending', 'Overdue', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-indigo-600 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-lg`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p>No invoices found</p>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-3 text-indigo-400 text-sm">Create your first invoice</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  {['Invoice #', 'Customer', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${textMuted} uppercase tracking-wider`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {filtered.map(inv => (
                  <tr key={inv.id} className={`${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-all`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-indigo-400 font-medium text-sm">{inv.invoice_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-medium text-sm ${textMain}`}>{inv.customer_name}</div>
                      {inv.customer_phone && <div className={`text-xs ${textMuted}`}>{inv.customer_phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${textMain}`}>{inv.invoice_date}</div>
                      {inv.due_date && <div className={`text-xs ${textMuted}`}>Due: {inv.due_date}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`font-bold text-sm ${textMain}`}>{formatINR(inv.total)}</div>
                      {inv.balance_due > 0 && inv.balance_due !== inv.total && (
                        <div className="text-xs text-red-400">Due: {formatINR(inv.balance_due)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge label={inv.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePreview(inv)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all" title="Preview"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(inv)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all" title="Edit"><Edit className="w-4 h-4" /></button>
                        {inv.status !== 'Paid' && (
                          <button onClick={() => handleMarkPaid(inv)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Mark Paid"><CheckCircle className="w-4 h-4" /></button>
                        )}
                        {inv.customer_phone && (
                          <button onClick={() => handleWhatsApp(inv)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-all" title="WhatsApp"><Share2 className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Invoice Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title={selectedInvoice ? 'Edit Invoice' : 'New GST Invoice'} size="xl">
        <div className="space-y-5">
          {/* Customer */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h4 className={`font-semibold mb-3 ${textMain}`}>Customer Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Select Customer</label>
                <select value={form.customer_id} onChange={e => handleCustomerSelect(e.target.value)} className={inputCls}>
                  <option value="">-- Select or type below --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Customer Name *</label>
                <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className={inputCls} placeholder="Customer name" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className={inputCls} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} className={inputCls} placeholder="customer@email.com" />
              </div>
              <div>
                <label className={labelCls}>GST Number</label>
                <input value={form.customer_gst} onChange={e => setForm(f => ({ ...f, customer_gst: e.target.value }))} className={inputCls} placeholder="27AABCU9603R1ZX" />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input value={form.customer_address} onChange={e => setForm(f => ({ ...f, customer_address: e.target.value }))} className={inputCls} placeholder="Full address" />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Invoice Date</label>
              <input type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Payment Mode</label>
              <select value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))} className={inputCls}>
                {['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Online', 'Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_interstate} onChange={e => {
                  const isInterstate = e.target.checked;
                  const newItems = form.items.map(item => calcItem(item, isInterstate));
                  setForm(f => ({ ...f, is_interstate: isInterstate, items: newItems }));
                }} className="w-4 h-4 rounded accent-indigo-500" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Interstate (IGST)</span>
              </label>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-semibold ${textMain}`}>Invoice Items</h4>
              <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/30 transition-all">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl`}>
                    {['Product', 'HSN/SAC', 'Qty', 'Unit', 'Rate', 'Disc%', 'Tax%', form.is_interstate ? 'IGST' : 'CGST/SGST', 'Total', ''].map(h => (
                      <th key={h} className={`px-2 py-2 text-left text-xs ${textMuted} font-medium`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-1">
                        <select value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)} className={`${inputCls} w-36`}>
                          <option value="">Select...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {!item.product_id && <input value={item.product_name} onChange={e => updateItem(idx, 'product_name', e.target.value)} className={`${inputCls} mt-1 w-36`} placeholder="Product name" />}
                      </td>
                      <td className="p-1"><input value={item.hsn_sac} onChange={e => updateItem(idx, 'hsn_sac', e.target.value)} className={`${inputCls} w-20`} placeholder="HSN" /></td>
                      <td className="p-1"><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} className={`${inputCls} w-16`} min="1" /></td>
                      <td className="p-1">
                        <select value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className={`${inputCls} w-16`}>
                          {['Pcs','Kg','Ltr','Mtr','Box','Pack','Dozen','Pair','Set','Other'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="p-1"><input type="number" value={item.price} onChange={e => updateItem(idx, 'price', +e.target.value)} className={`${inputCls} w-24`} min="0" /></td>
                      <td className="p-1"><input type="number" value={item.discount_percent} onChange={e => updateItem(idx, 'discount_percent', +e.target.value)} className={`${inputCls} w-16`} min="0" max="100" /></td>
                      <td className="p-1">
                        <select value={item.tax_percent} onChange={e => updateItem(idx, 'tax_percent', +e.target.value)} className={`${inputCls} w-16`}>
                          {[0, 0.1, 0.25, 3, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="p-1 text-xs text-indigo-400 whitespace-nowrap">
                        {form.is_interstate ? formatINR(item.igst) : `${formatINR(item.cgst)} / ${formatINR(item.sgst)}`}
                      </td>
                      <td className="p-1 font-bold text-emerald-400 whitespace-nowrap">{formatINR(item.total)}</td>
                      <td className="p-1">
                        {form.items.length > 1 && (
                          <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className={`w-72 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
              <div className="flex justify-between text-sm"><span className={textMuted}>Subtotal</span><span className={textMain}>{formatINR(totals.subtotal)}</span></div>
              {form.is_interstate
                ? <div className="flex justify-between text-sm"><span className={textMuted}>IGST</span><span className={textMain}>{formatINR(totals.igst_total)}</span></div>
                : <>
                    <div className="flex justify-between text-sm"><span className={textMuted}>CGST</span><span className={textMain}>{formatINR(totals.cgst_total)}</span></div>
                    <div className="flex justify-between text-sm"><span className={textMuted}>SGST</span><span className={textMain}>{formatINR(totals.sgst_total)}</span></div>
                  </>
              }
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-700/30">
                <span>Total</span><span className="text-emerald-400">{formatINR(totals.total)}</span>
              </div>
              <div className={`text-xs italic ${textMuted} pt-1`}>{amountInWords(totals.total)}</div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} h-20 resize-none`} placeholder="Additional notes..." />
            </div>
            <div>
              <label className={labelCls}>Terms & Conditions</label>
              <textarea value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} className={`${inputCls} h-20 resize-none`} placeholder="Payment terms..." />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-800/30">
            <button onClick={() => { setShowForm(false); resetForm(); }} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'} transition-all`}>Cancel</button>
            <button onClick={() => handleSave('Draft')} className="px-4 py-2 rounded-xl border border-indigo-500 text-indigo-400 text-sm hover:bg-indigo-500/10 transition-all">Save Draft</button>
            <button onClick={() => handleSave('Sent')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg hover:shadow-indigo-500/30 transition-all">
              <Send className="w-4 h-4 inline mr-1" />Send Invoice
            </button>
          </div>
        </div>
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={`Invoice #${selectedInvoice?.invoice_number}`} size="lg">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
              {selectedInvoice.customer_phone && (
                <button onClick={() => handleWhatsApp(selectedInvoice)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium">
                  <Share2 className="w-4 h-4" /> WhatsApp
                </button>
              )}
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} space-y-3`}>
              <div className="flex justify-between">
                <div>
                  <div className={`text-lg font-bold text-indigo-400`}>{selectedInvoice.invoice_number}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedInvoice.customer_name}</div>
                </div>
                <Badge label={selectedInvoice.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Date:</span> <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedInvoice.invoice_date}</span></div>
                <div><span className="text-gray-500">Due:</span> <span className={isDark ? 'text-white' : 'text-gray-900'}>{selectedInvoice.due_date || 'On receipt'}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-bold text-emerald-400">{formatINR(selectedInvoice.total)}</span></div>
                <div><span className="text-gray-500">Balance:</span> <span className={`font-bold ${(selectedInvoice.balance_due||0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatINR(selectedInvoice.balance_due)}</span></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Items</p>
                {(selectedInvoice.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-700/20">
                    <span>{item.product_name} × {item.quantity} {item.unit}</span>
                    <span className="font-medium">{formatINR(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
