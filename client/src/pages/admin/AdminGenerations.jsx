import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  FileText,
  Search,
  Flag,
  Trash2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function AdminGenerations() {
  const [generations, setGenerations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGenerations = async (page = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 15 });
      if (search.trim()) q.append('search', search.trim());
      if (flaggedOnly) q.append('flagged', 'true');

      const res = await api.get(`/admin/generations?${q.toString()}`);
      setGenerations(res.generations || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load generations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations(1);
  }, [flaggedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGenerations(1);
  };

  const handleToggleFlag = async (gen) => {
    const nextFlag = !gen.is_flagged;
    try {
      await api.put(`/admin/generations/${gen.id}/flag`, { is_flagged: nextFlag });
      setGenerations(generations.map(g => g.id === gen.id ? { ...g, is_flagged: nextFlag } : g));
    } catch (err) {
      alert('Failed to update content flag: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this generation for moderation violation?')) return;
    try {
      await api.delete(`/admin/generations/${id}`);
      setGenerations(generations.filter(g => g.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Content Moderation & Generations</h1>
          <p className="text-slate-400 text-xs mt-1">Review user-generated reels copy, moderate flags, and manage safety.</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
            />
          </form>

          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              flaggedOnly
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Flagged Only</span>
          </button>
        </div>
      </div>

      {/* Generations Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No generations matched the criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {generations.map((gen) => (
            <div
              key={gen.id}
              className={`p-6 bg-slate-900 border rounded-2xl space-y-3 transition ${
                gen.is_flagged ? 'border-amber-500/40 bg-amber-950/10' : 'border-indigo-950/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  {gen.is_flagged && (
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> FLAGGED
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    User: {gen.profiles?.email || gen.user_id.slice(0, 8)}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(gen.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFlag(gen)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      gen.is_flagged
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{gen.is_flagged ? 'Unflag' : 'Flag'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(gen.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Hook</p>
                <p className="text-sm font-bold text-white">{gen.hook}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Caption</p>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto">
                  {gen.caption}
                </p>
              </div>

              {gen.hashtags && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {[...(gen.hashtags.high || []), ...(gen.hashtags.medium || []), ...(gen.hashtags.niche || [])].slice(0, 12).map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] rounded">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchGenerations(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 bg-slate-800 rounded-lg hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchGenerations(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 bg-slate-800 rounded-lg hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
