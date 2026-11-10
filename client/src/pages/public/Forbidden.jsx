import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-amber-400" />
      </div>
      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20 mb-3">
        HTTP 403 Forbidden
      </span>
      <h1 className="text-3xl font-extrabold text-white mb-3">Access Denied</h1>
      <p className="text-slate-400 max-w-md mb-8 text-sm leading-relaxed">
        You do not possess the required administrative clearance to view this sector. All unauthorized access attempts are logged for security auditing.
      </p>
      <div className="flex items-center gap-4">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Creator Studio
        </Link>
        <Link
          to="/"
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
        >
          Home Page
        </Link>
      </div>
    </div>
  );
}
