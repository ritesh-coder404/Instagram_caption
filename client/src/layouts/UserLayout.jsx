import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  History,
  BookmarkCheck,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Zap,
  ChevronRight
} from 'lucide-react';

export default function UserLayout() {
  const { user, profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [usage, setUsage] = useState({ countThisMonth: 0, monthlyLimit: 5, plan: 'free' });

  useEffect(() => {
    async function loadUsage() {
      try {
        const data = await api.get('/user/dashboard');
        if (data?.usage) {
          setUsage(data.usage);
        }
      } catch (err) {
        // quiet error on initial mount
      }
    }
    loadUsage();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { name: 'Generate', path: '/app/generate', icon: Wand2 },
    { name: 'History', path: '/app/history', icon: History },
    { name: 'Saved Sets', path: '/app/saved-sets', icon: BookmarkCheck },
    { name: 'Billing', path: '/app/billing', icon: CreditCard },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  const isUnlimited = usage.monthlyLimit === -1;
  const usagePercentage = isUnlimited 
    ? 100 
    : Math.min(100, Math.round((usage.countThisMonth / (usage.monthlyLimit || 5)) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">CaptionCraft</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between z-40 transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-6 hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">CaptionCraft</span>
              <span className="block text-[10px] uppercase font-bold text-purple-400 tracking-wider">Creator Studio</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 font-semibold border border-purple-500/20 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Admin Switcher Link (Visible only to users with role='admin') */}
            {role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center justify-between px-3.5 py-2.5 mt-4 rounded-xl text-xs font-semibold bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40 transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <span>Admin Panel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              </Link>
            )}
          </nav>
        </div>

        {/* Sidebar Footer: Usage Meter & Profile */}
        <div className="p-4 border-t border-slate-800/80 space-y-4">
          {/* Usage Meter Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Plan Usage
              </span>
              <span className="font-semibold text-slate-200">
                {isUnlimited ? 'Unlimited' : `${usage.countThisMonth} of ${usage.monthlyLimit}`}
              </span>
            </div>
            {!isUnlimited && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    usagePercentage >= 90 ? 'bg-rose-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            )}
            {usage.plan === 'free' && (
              <Link
                to="/app/billing"
                className="block text-center text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
              >
                Upgrade to Pro (Rs 199) →
              </Link>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name || user?.email?.split('@')[0]}
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet context={{ usage, setUsage }} />
      </main>
    </div>
  );
}
