import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Users,
  Wand2,
  IndianRupee,
  Cpu,
  TrendingUp,
  ShieldCheck,
  Crown,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const metrics = data?.metrics || {};
  const charts = data?.charts || { signups: [], generations: [], plans: [] };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-cyan-300 text-xs font-semibold rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Operational Command Center
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">SaaS Executive Overview</h1>
          <p className="text-slate-400 text-xs mt-1">Live metrics, revenue aggregates, API load, and system health.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="p-5 bg-slate-900 border border-indigo-950/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
            <span>Total Registered</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalUsers ?? 0}</div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{metrics.users7Days ?? 0} in last 7 days</span>
          </p>
        </div>

        {/* Pro Subscribers */}
        <div className="p-5 bg-slate-900 border border-indigo-950/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
            <span>Pro Subscribers</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.proUsers ?? 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Conversion: {metrics.totalUsers ? ((metrics.proUsers / metrics.totalUsers) * 100).toFixed(1) : 0}%
          </p>
        </div>

        {/* Total Generations */}
        <div className="p-5 bg-slate-900 border border-indigo-950/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
            <span>Generations Created</span>
            <Wand2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalGenerations ?? 0}</div>
          <p className="text-[11px] text-purple-400 mt-1">AI Reels generated</p>
        </div>

        {/* Gross Revenue */}
        <div className="p-5 bg-slate-900 border border-indigo-950/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
            <span>Total Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">₹{metrics.totalRevenueINR ?? 0}</div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Est. API Cost:</span>
            <span className="font-mono text-cyan-400">${metrics.estimatedApiCostUSD ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups Over Time */}
        <div className="p-6 bg-slate-900 border border-indigo-950 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Creator Registrations (Last 7 Days)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.signups}>
                <defs>
                  <linearGradient id="signupColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#818cf8', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="signups" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#signupColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Generations Per Day */}
        <div className="p-6 bg-slate-900 border border-indigo-950 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              AI Generations Activity (Last 7 Days)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.generations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#38bdf8', fontSize: '12px' }}
                />
                <Bar dataKey="generations" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
