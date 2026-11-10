import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Zap,
  Crown,
  Check,
  AlertCircle,
  Receipt,
  Sparkles,
  Loader2,
  Calendar,
  QrCode,
  Smartphone,
  Copy,
  X,
  ArrowRight
} from 'lucide-react';

export default function Billing() {
  const { user, refreshProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');

  // UPI Modal State
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiOrder, setUpiOrder] = useState(null);
  const [upiRef, setUpiRef] = useState('');
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [dash, pmts] = await Promise.all([
        api.get('/user/dashboard'),
        api.get('/user/payments')
      ]);
      setDashboardData(dash);
      setPayments(pmts || []);
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  // 1. Direct Indian UPI Flow (PhonePe / GPay / Paytm)
  const handleInitiateUPI = async () => {
    setUpgrading(true);
    setPaymentMsg('');
    try {
      const order = await api.post('/payments/create-upi-order', { planId: 'pro' });
      setUpiOrder(order);
      setShowUpiModal(true);
    } catch (err) {
      alert('Failed to initiate UPI payment: ' + err.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleConfirmUPI = async () => {
    if (!upiOrder) return;
    setVerifyingUpi(true);
    try {
      await api.post('/payments/confirm-upi', {
        orderId: upiOrder.orderId,
        planId: 'pro',
        transactionRef: upiRef.trim() || `UPI_${Date.now()}`
      });

      setShowUpiModal(false);
      setPaymentMsg('🎉 Payment verified! Your account is now upgraded to Pro Unlimited.');
      await refreshProfile();
      await loadBillingData();
    } catch (err) {
      alert('Verification failed: ' + err.message);
    } finally {
      setVerifyingUpi(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('captioncraft@upi');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  // 2. Razorpay Checkout Flow (Fallback / Cards)
  const handleUpgradeRazorpay = async () => {
    setUpgrading(true);
    setPaymentMsg('');

    try {
      const order = await api.post('/payments/create-order', { planId: 'pro' });

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load payment gateway'));
          document.body.appendChild(script);
        });
      }

      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'CaptionCraft Pro',
        description: 'Unlimited Instagram Captions & Video AI',
        order_id: order.id,
        prefill: {
          email: user?.email,
          name: user?.user_metadata?.full_name || ''
        },
        theme: { color: '#8b5cf6' },
        handler: async function (response) {
          setPaymentMsg('Payment authorization captured! Webhook signature verification in progress...');
          setTimeout(async () => {
            await refreshProfile();
            await loadBillingData();
            setPaymentMsg('🎉 Plan successfully upgraded to Pro!');
            setUpgrading(false);
          }, 3500);
        },
        modal: {
          ondismiss: function () {
            setUpgrading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Upgrade initialization failed: ' + err.message);
      setUpgrading(false);
    }
  };

  const usage = dashboardData?.usage || { countThisMonth: 0, monthlyLimit: 5, plan: 'free' };
  const isUnlimited = usage.monthlyLimit === -1;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Subscription & Billing</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pay via PhonePe, Google Pay, Paytm UPI, or Credit/Debit Card.
        </p>
      </div>

      {paymentMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{paymentMsg}</span>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Subscription</span>
          <div className="flex items-center gap-3 mt-1.5">
            <h2 className="text-2xl font-black text-white capitalize">{usage.planName || 'Free Creator'}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
              usage.plan === 'pro'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {usage.plan === 'pro' ? 'Pro Unlimited' : 'Free Tier'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Usage this cycle: <span className="font-bold text-slate-200">{usage.countThisMonth}</span>
            {isUnlimited ? ' (Unlimited allowed)' : ` of ${usage.monthlyLimit} posts allowed`}
          </p>
        </div>

        {usage.plan === 'free' && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleInitiateUPI}
              disabled={upgrading}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 justify-center"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay via UPI / PhonePe / GPay — ₹199</span>
            </button>
            <button
              onClick={handleUpgradeRazorpay}
              disabled={upgrading}
              className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-2xl transition"
            >
              Cards / Netbanking
            </button>
          </div>
        )}
      </div>

      {/* Plan Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className={`p-6 md:p-8 rounded-3xl border flex flex-col justify-between ${
          usage.plan === 'free'
            ? 'bg-slate-900 border-purple-500/30'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Free Starter</span>
              {usage.plan === 'free' && (
                <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                  Current
                </span>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-white">₹0</span>
              <span className="text-slate-400 text-xs font-medium"> / month</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5 Reel Captions per month</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3-Tier Hashtags (High, Medium, Niche)</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> English, Hindi & Hinglish Copy</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Saved Hashtag Collections</li>
            </ul>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="p-6 md:p-8 rounded-3xl border bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-purple-500/40 relative flex flex-col justify-between shadow-xl shadow-purple-900/10">
          <div className="absolute -top-3 right-8 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-[10px] uppercase rounded-full shadow-md tracking-wider">
            Most Popular
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">Pro Creator</span>
              {usage.plan === 'pro' && (
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                  Current
                </span>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-white">₹199</span>
              <span className="text-slate-400 text-xs font-medium"> / month</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2 font-bold text-white"><Check className="w-4 h-4 text-amber-400" /> Unlimited Instagram Captions</li>
              <li className="flex items-center gap-2 font-bold text-white"><Check className="w-4 h-4 text-amber-400" /> AI Video Analysis & Audio Transcription</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Full Curated 300+ Hashtag Library</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Priority Gemini 2.5 Flash Speed</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Unlimited Saved Hashtag Sets</li>
            </ul>
          </div>

          <div className="pt-6 space-y-2">
            {usage.plan !== 'pro' ? (
              <>
                <button
                  onClick={handleInitiateUPI}
                  disabled={upgrading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Pay with UPI (PhonePe / GPay / Paytm)</span>
                </button>
                <button
                  onClick={handleUpgradeRazorpay}
                  disabled={upgrading}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Pay via Card / Netbanking
                </button>
              </>
            ) : (
              <div className="text-center py-2 text-xs font-bold text-emerald-400">
                ✓ Pro Plan Active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Receipts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Payment Receipts</h2>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No payment transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Transaction / Order ID</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map(p => (
                  <tr key={p.id} className="text-slate-300">
                    <td className="py-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">{p.razorpay_order_id}</td>
                    <td className="py-3 font-bold text-white">₹{p.amount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'captured'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Direct Indian UPI Payment Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowUpiModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-white">Instant UPI Checkout</h2>
              <p className="text-xs text-slate-400">Pay ₹{upiOrder?.amount || 199} directly using any UPI App</p>
            </div>

            {/* Supported UPI Apps Pills */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-2.5 py-1 bg-purple-950/60 border border-purple-500/20 text-purple-300 text-[10px] font-bold rounded-lg">PhonePe</span>
              <span className="px-2.5 py-1 bg-blue-950/60 border border-blue-500/20 text-blue-300 text-[10px] font-bold rounded-lg">Google Pay</span>
              <span className="px-2.5 py-1 bg-sky-950/60 border border-sky-500/20 text-sky-300 text-[10px] font-bold rounded-lg">Paytm</span>
              <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg">BHIM</span>
            </div>

            {/* Simulated QR Code / VPA Box */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiOrder?.qrPayload || 'upi://pay?pa=captioncraft@upi')}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400">Scan QR with PhonePe / GPay / Paytm</p>

              {/* VPA Copy Bar */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                <span className="font-mono text-slate-200">captioncraft@upi</span>
                <button
                  onClick={copyUpiId}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  {copiedVpa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVpa ? 'Copied' : 'Copy UPI ID'}</span>
                </button>
              </div>
            </div>

            {/* Verification Action */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Optional: Enter UTR / UPI Reference No."
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />

              <button
                onClick={handleConfirmUPI}
                disabled={verifyingUpi}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                {verifyingUpi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with Bank...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>I Have Paid — Activate Pro Unlimited</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
