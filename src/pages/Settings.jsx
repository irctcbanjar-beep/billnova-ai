import React, { useState, useEffect } from 'react';
import { Business } from '../api/entities';
import { useBusiness } from '../contexts/BusinessContext';
import { useTheme } from '../contexts/ThemeContext';
import { INDIAN_STATES } from '../utils/gst';
import { Save, Plus, Building2, CreditCard, FileText, Bell, Shield, ChevronRight, Check } from 'lucide-react';

const TABS = ['Business', 'Billing', 'Invoice', 'Subscription'];

export default function Settings() {
  const { currentBusiness, refreshBusiness, setCurrentBusiness } = useBusiness();
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('Business');
  const [showNewBiz, setShowNewBiz] = useState(false);
  const [newBizForm, setNewBizForm] = useState({ business_name: '', gst_number: '', phone: '', email: '', address: '', state: '' });

  useEffect(() => {
    if (currentBusiness) setForm({ ...currentBusiness });
  }, [currentBusiness]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentBusiness?.id) {
        const updated = await Business.update(currentBusiness.id, form);
        setCurrentBusiness({ ...currentBusiness, ...form });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleCreateBusiness = async () => {
    try {
      const biz = await Business.create({
        ...newBizForm, subscription_plan: 'Free', subscription_status: 'Trial',
        invoice_prefix: 'INV', invoice_counter: 1, currency: 'INR', is_active: true,
      });
      await refreshBusiness();
      setShowNewBiz(false);
      setNewBizForm({ business_name: '', gst_number: '', phone: '', email: '', address: '', state: '' });
    } catch (e) { console.error(e); }
  };

  const PLANS = [
    { name: 'Free', price: '₹0', features: ['5 Invoices/month', '1 User', 'Basic Reports', 'Email Support'], color: 'gray' },
    { name: 'Starter', price: '₹499/mo', features: ['50 Invoices/month', '3 Users', 'GST Reports', 'WhatsApp Invoices', 'Priority Support'], color: 'blue', popular: false },
    { name: 'Pro', price: '₹999/mo', features: ['Unlimited Invoices', '10 Users', 'AI Insights', 'Multi-business', 'Custom Domain', 'API Access'], color: 'indigo', popular: true },
    { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Dedicated Support', 'White-label', 'Custom Integrations', 'SLA Guarantee'], color: 'purple' },
  ];

  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  if (!currentBusiness && !showNewBiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className={`text-2xl font-bold ${textMain}`}>Welcome to BillNova!</h2>
        <p className={textMuted}>Set up your business to get started</p>
        <button onClick={() => setShowNewBiz(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg">
          <Plus className="w-5 h-5" /> Create Business Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Settings</h1>
          <p className={`text-sm ${textMuted}`}>Manage your business profile and preferences</p>
        </div>
        <button onClick={() => setShowNewBiz(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/50 text-indigo-400 text-sm hover:bg-indigo-500/10 transition-all">
          <Plus className="w-4 h-4" /> Add Business
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl border ${cardBg} w-fit`}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : `${textMuted} hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* BUSINESS TAB */}
      {activeTab === 'Business' && (
        <div className={`rounded-2xl border ${cardBg} p-6 shadow-lg space-y-5`}>
          <h3 className={`font-bold text-base ${textMain}`}>Business Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Business Name *</label>
              <input value={form.business_name || ''} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className={inputCls} placeholder="Your Business Name" />
            </div>
            <div>
              <label className={labelCls}>GSTIN</label>
              <input value={form.gst_number || ''} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} className={inputCls} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className={labelCls}>PAN Number</label>
              <input value={form.pan_number || ''} onChange={e => setForm(f => ({ ...f, pan_number: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className={inputCls} placeholder="https://yourbusiness.com" />
            </div>
            <div>
              <label className={labelCls}>Business Type</label>
              <select value={form.business_type || ''} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))} className={inputCls}>
                <option value="">Select...</option>
                {['Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Address</label>
              <input value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <select value={form.state || ''} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={inputCls}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Pincode</label>
              <input value={form.pincode || ''} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} className={inputCls} />
            </div>
          </div>
          
          {/* Logo & Signature */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800/30">
            <div>
              <label className={labelCls}>Logo URL</label>
              <input value={form.logo_url || ''} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} className={inputCls} placeholder="https://..." />
              {form.logo_url && <img src={form.logo_url} className="mt-2 h-12 rounded-lg object-contain" alt="Logo preview" onError={e => e.target.style.display='none'} />}
            </div>
            <div>
              <label className={labelCls}>Signature URL</label>
              <input value={form.signature_url || ''} onChange={e => setForm(f => ({ ...f, signature_url: e.target.value }))} className={inputCls} placeholder="https://..." />
              {form.signature_url && <img src={form.signature_url} className="mt-2 h-12 rounded-lg object-contain" alt="Signature preview" onError={e => e.target.style.display='none'} />}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50">
            {saved ? <Check className="w-4 h-4" /> : saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* BILLING TAB */}
      {activeTab === 'Billing' && (
        <div className={`rounded-2xl border ${cardBg} p-6 shadow-lg space-y-5`}>
          <h3 className={`font-bold text-base ${textMain}`}>Banking & Payment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Bank Name</label>
              <input value={form.bank_name || ''} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className={inputCls} placeholder="HDFC Bank" />
            </div>
            <div>
              <label className={labelCls}>Account Number</label>
              <input value={form.bank_account || ''} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>IFSC Code</label>
              <input value={form.bank_ifsc || ''} onChange={e => setForm(f => ({ ...f, bank_ifsc: e.target.value }))} className={inputCls} placeholder="HDFC0001234" />
            </div>
            <div>
              <label className={labelCls}>UPI ID</label>
              <input value={form.upi_id || ''} onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))} className={inputCls} placeholder="business@paytm" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* INVOICE TAB */}
      {activeTab === 'Invoice' && (
        <div className={`rounded-2xl border ${cardBg} p-6 shadow-lg space-y-5`}>
          <h3 className={`font-bold text-base ${textMain}`}>Invoice Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Invoice Prefix</label>
              <input value={form.invoice_prefix || 'INV'} onChange={e => setForm(f => ({ ...f, invoice_prefix: e.target.value }))} className={inputCls} placeholder="INV" />
            </div>
            <div>
              <label className={labelCls}>Starting Invoice Number</label>
              <input type="number" value={form.invoice_counter || 1} onChange={e => setForm(f => ({ ...f, invoice_counter: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={form.currency || 'INR'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputCls}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Financial Year</label>
              <select value={form.financial_year || '2025-26'} onChange={e => setForm(f => ({ ...f, financial_year: e.target.value }))} className={inputCls}>
                {['2023-24','2024-25','2025-26','2026-27'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className={`text-sm font-medium text-indigo-400 mb-1`}>Invoice Number Preview</p>
            <p className={`font-mono text-lg ${textMain}`}>{form.invoice_prefix || 'INV'}-{String(form.invoice_counter || 1).padStart(4, '0')}</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* SUBSCRIPTION TAB */}
      {activeTab === 'Subscription' && (
        <div className="space-y-4">
          <div className={`rounded-2xl border ${cardBg} p-5`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-sm ${textMuted}`}>Current Plan:</span>
              <span className="font-bold text-lg text-indigo-400">{currentBusiness?.subscription_plan || 'Free'}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${currentBusiness?.subscription_status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {currentBusiness?.subscription_status || 'Trial'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => (
              <div key={plan.name} className={`rounded-2xl border p-5 ${plan.popular ? 'border-indigo-500/50 bg-indigo-500/5' : cardBg} ${plan.name === currentBusiness?.subscription_plan ? `ring-2 ring-indigo-500` : ''} shadow-lg relative`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</div>}
                <div className={`font-bold text-lg text-${plan.color}-400 mb-1`}>{plan.name}</div>
                <div className={`text-2xl font-black ${textMain} mb-3`}>{plan.price}</div>
                <div className="space-y-2 mb-4">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className={textMuted}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, subscription_plan: plan.name }))}
                  className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${plan.name === (form.subscription_plan || currentBusiness?.subscription_plan) ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : isDark ? 'border border-gray-700 text-gray-300 hover:bg-gray-800' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {plan.name === currentBusiness?.subscription_plan ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Business Modal */}
      {showNewBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewBiz(false)} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${textMain}`}>Create New Business</h3>
            <div className="space-y-3">
              <div><label className={labelCls}>Business Name *</label><input value={newBizForm.business_name} onChange={e => setNewBizForm(f => ({ ...f, business_name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>GSTIN</label><input value={newBizForm.gst_number} onChange={e => setNewBizForm(f => ({ ...f, gst_number: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input value={newBizForm.phone} onChange={e => setNewBizForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Email</label><input value={newBizForm.email} onChange={e => setNewBizForm(f => ({ ...f, email: e.target.value }))} className={inputCls} /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewBiz(false)} className={`flex-1 py-2 rounded-xl border text-sm ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
                <button onClick={handleCreateBusiness} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
