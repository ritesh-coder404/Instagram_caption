import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';

export default function Forbidden() {
  const { user, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-amber-400" />
      </div>
      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20 mb-3">
        HTTP 403 Forbidden
      </span>
      <h1 className="text-3xl font-extrabold text-white mb-3">Admin Access Required</h1>
      <p className="text-slate-400 max-w-md mb-4 text-sm leading-relaxed">
        Aap logged in hain as <strong className="text-white">{user?.email || 'User'}</strong>, lekin is account ka role abhi <span className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded font-mono text-xs">"{role}"</span> hai.
      </p>
      
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full mb-6 text-left">
        <p className="text-xs text-slate-300 font-semibold mb-1">👑 Admin Banane Ke Liye (Supabase SQL Editor me run karein):</p>
        <code className="text-[11px] bg-slate-950 p-2.5 rounded-lg block font-mono text-cyan-300 select-all border border-slate-800">
          UPDATE public.profiles SET role = 'admin' WHERE email = '{user?.email || 'APNA_EMAIL'}';
        </code>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go to User App (/app)
        </Link>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 rounded-xl text-xs font-semibold transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out & Switch Account
        </button>
      </div>
    </div>
  );
}
