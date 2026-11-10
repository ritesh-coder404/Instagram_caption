import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-blue-400" />
      </div>
      <h1 className="text-5xl font-black text-white mb-2">404</h1>
      <h2 className="text-xl font-semibold text-neutral-300 mb-3">Page Not Found</h2>
      <p className="text-neutral-400 max-w-sm mb-8 text-sm">
        The page you are trying to visit does not exist. Choose one of the destinations below:
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-full text-xs transition hover:bg-neutral-200"
        >
          <ArrowLeft className="w-4 h-4" /> Home Page
        </Link>
        <Link
          to="/login"
          className="px-6 py-2.5 bg-neutral-900 border border-neutral-800 text-white font-medium rounded-full text-xs transition hover:bg-neutral-800"
        >
          Sign In
        </Link>
        <Link
          to="/admin"
          className="px-6 py-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 font-medium rounded-full text-xs transition hover:bg-blue-600/50"
        >
          Admin Console
        </Link>
      </div>
    </div>
  );
}
