import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  BarChart3,
  Users2,
  FileText,
  Hash,
  IndianRupee,
  Layers,
  FileSpreadsheet,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function AdminLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin', icon: BarChart3 },
    { name: 'Users', path: '/admin/users', icon: Users2 },
    { name: 'Generations', path: '/admin/generations', icon: FileText },
    { name: 'Hashtag Library', path: '/admin/hashtags', icon: Hash },
    { name: 'Payments', path: '/admin/payments', icon: IndianRupee },
    { name: 'Plans & Pricing', path: '/admin/plans', icon: Layers },
    { name: 'Reports & Logs', path: '/admin/reports', icon: FileSpreadsheet },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-indigo-950 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-white tracking-wide">CaptionCraft Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-indigo-900/40 flex flex-col justify-between z-40 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="p-6 hidden md:flex items-center justify-between border-b border-indigo-950/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight">CaptionCraft</span>
                <span className="block text-[10px] uppercase font-black text-cyan-400 tracking-wider">Master Console</span>
              </div>
            </div>
          </div>

          {/* Quick Return to User App */}
          <div className="px-4 py-3">
            <Link
              to="/app"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white transition border border-slate-700/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Creator App</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-cyan-300 font-semibold border border-indigo-500/30 shadow-inner'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-indigo-950/60 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-300">Admin Clearance Verified</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name || 'Administrator'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
