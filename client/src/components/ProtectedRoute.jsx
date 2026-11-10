import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, status, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
        <p className="text-slate-400 max-w-md mb-6">
          Your CaptionCraft account has been suspended by an administrator. Please contact support to resolve this issue.
        </p>
        <button
          onClick={() => window.location.href = 'mailto:support@captioncraft.io'}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
        >
          Contact Support
        </button>
      </div>
    );
  }

  return <Outlet />;
}
