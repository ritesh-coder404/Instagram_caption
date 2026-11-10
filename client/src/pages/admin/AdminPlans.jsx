import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Layers,
  Edit2,
  Check,
  X,
  IndianRupee,
  ShieldCheck,
  Save
} from 'lucide-react';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [limit, setLimit] = useState(5);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/plans');
      setPlans(data || []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenEdit = (p) => {
    setEditingPlan(p);
    setName(p.name);
    setPrice(p.price_inr);
    setLimit(p.monthly_limit);
    setActive(p.is_active);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);

    try {
      const res = await api.put(`/admin/plans/${editingPlan.id}`, {
        name,
        price_inr: price,
        monthly_limit: limit,
        is_active: active
      });

      setPlans(plans.map(p => p.id === editingPlan.id ? res.plan : p));
      setEditingPlan(null);
    } catch (err) {
      alert('Plan modification failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Subscription Plans Configuration</h1>
        <p className="text-slate-400 text-xs mt-1">
          Adjust pricing tiers, generation thresholds, and availability in real-time without modifying frontend code.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(p => (
          <div
            key={p.id}
            className="p-6 bg-slate-900 border border-indigo-950/80 rounded-3xl space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded">
                  PLAN ID: {p.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  p.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {p.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white">{p.name}</h2>
              <div className="text-3xl font-black text-white mt-2">
                ₹{p.price_inr}
                <span className="text-xs text-slate-400 font-normal"> / month</span>
              </div>

              <div className="text-xs text-slate-300 mt-4 space-y-2">
                <p>
                  Monthly Allowance:{' '}
                  <span className="font-bold text-white">
                    {p.monthly_limit === -1 ? 'Unlimited Generations' : `${p.monthly_limit} Generations`}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => handleOpenEdit(p)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Configure Pricing & Limits</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Edit Plan: {editingPlan.id}</h2>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Plan Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Monthly Limit (-1 = ∞)
                  </label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) ?? -1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-plan-check"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="active-plan-check" className="text-xs text-slate-300 select-none">
                  Plan Active and Visible to Creators
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  {saving ? 'Updating...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
