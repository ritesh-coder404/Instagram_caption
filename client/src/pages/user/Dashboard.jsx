import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Wand2,
  Sparkles,
  Zap,
  TrendingUp,
  History,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Layers,
  Crown
} from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/user/dashboard');
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleCopy = (gen) => {
    const allTags = [
      ...(gen.hashtags?.high || []),
      ...(gen.hashtags?.medium || []),
      ...(gen.hashtags?.niche || [])
    ].join(' ');

    const fullText = `${gen.hook}\n\n${gen.caption}\n\n${allTags}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(gen.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const usage = data?.usage || { countThisMonth: 0, monthlyLimit: 5, plan: 'free' };
  const isUnlimited = usage.monthlyLimit === -1;
  const percentage = isUnlimited ? 100 : Math.min(100, Math.round((usage.countThisMonth / (usage.monthlyLimit || 5)) * 100));

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/30 via-slate-900 to-slate-900 border border-purple-500/20 rounded-3xl p-6 md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Instagram Growth Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Save 20-30 minutes per reel. Generate viral hooks, high-retention captions, and 3-tier hashtags in seconds.
          </p>
        </div>
        <Link
          to="/app/generate"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition-all transform active:scale-95"
        >
          <Wand2 className="w-4 h-4" />
          <span>New Caption</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Plan & Usage */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscription</span>
            <span className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              {usage.plan === 'pro' ? <Crown className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-extrabold text-white capitalize">{usage.planName || 'Free Creator'}</span>
            {usage.plan === 'free' && (
              <Link to="/app/billing" className="text-xs text-amber-400 font-bold hover:underline">
                Upgrade →
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {isUnlimited ? 'Unlimited generations active' : `${usage.countThisMonth} of ${usage.monthlyLimit} used this cycle`}
          </p>
          {!isUnlimited && (
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full ${percentage >= 90 ? 'bg-rose-500' : 'bg-purple-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Monthly Activity */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Generations This Month</span>
            <span className="p-2 bg-pink-500/10 rounded-xl text-pink-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">
            {usage.countThisMonth || 0}
          </div>
          <p className="text-xs text-slate-400">
            Total lifetime: <span className="font-semibold text-slate-200">{usage.totalGenerations || 0}</span>
          </p>
        </div>

        {/* Curated Hashtag Tiers */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hashtag Strategy</span>
            <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">3 Tiers</div>
          <p className="text-xs text-slate-400">
            High-reach (5) · Medium (8) · Niche (10)
          </p>
        </div>
      </div>

      {/* Recent Generations Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Recent Generations</h2>
          </div>
          <Link
            to="/app/history"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (data?.recentGenerations || []).length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <Wand2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No captions generated yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Enter your video topic or reel concept and let CaptionCraft write high-converting copy for you.
            </p>
            <Link
              to="/app/generate"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
            >
              Generate First Caption
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentGenerations.map((gen) => (
              <div
                key={gen.id}
                className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold rounded-md uppercase">
                      {gen.tone}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(gen.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate max-w-xl">{gen.hook}</p>
                </div>
                <button
                  onClick={() => handleCopy(gen)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition flex-shrink-0"
                >
                  {copiedId === gen.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
