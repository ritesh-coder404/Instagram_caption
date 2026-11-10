import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Forbidden from '../pages/public/Forbidden';
import { Loader2 } from 'lucide-react';

export default function AdminRoute() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Strict check: Non-admin users are immediately presented with 403 Forbidden
  if (role !== 'admin') {
    return <Forbidden />;
  }

  return <Outlet />;
}
