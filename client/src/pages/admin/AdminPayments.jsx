import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  IndianRupee,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/payments');
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = ['ID,User Email,Razorpay Order ID,Razorpay Payment ID,Amount (INR),Status,Date'];
    const rows = payments.map(p =>
      `"${p.id}","${p.profiles?.email || p.user_id}","${p.razorpay_order_id || ''}","${p.razorpay_payment_id || ''}","${p.amount}","${p.status}","${p.created_at}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `captioncraft_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.profiles?.email?.toLowerCase().includes(term) ||
      p.razorpay_order_id?.toLowerCase().includes(term) ||
      p.razorpay_payment_id?.toLowerCase().includes(term)
    );
  });

  const totalCaptured = payments
    .filter(p => p.status === 'captured')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Payments & Subscription Audit</h1>
          <p className="text-slate-400 text-xs mt-1">Audit Razorpay transactions and export financial records.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Payments CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Revenue Banner */}
      <div className="p-6 bg-slate-900 border border-indigo-950/80 rounded-3xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Gross Settled Revenue</span>
          <div className="text-2xl font-black text-white mt-1">₹{totalCaptured}</div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total Transactions</span>
          <div className="text-lg font-bold text-slate-200">{payments.length}</div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-indigo-950/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-indigo-950/80">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-indigo-950/80 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Customer Email</th>
                <th className="py-4 px-6">Razorpay Order ID</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition text-slate-300">
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {p.profiles?.email || p.user_id}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                      {p.razorpay_order_id}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">₹{p.amount}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'captured'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
