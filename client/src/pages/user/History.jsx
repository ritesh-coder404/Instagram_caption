import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  History as HistoryIcon,
  Search,
  Copy,
  Check,
  Trash2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText
} from 'lucide-react';

export default function History() {
  const [generations, setGenerations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchGenerations = async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 10 });
      if (searchQuery.trim()) q.append('search', searchQuery.trim());

      const res = await api.get(`/user/generations?${q.toString()}`);
      setGenerations(res.generations || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations(1, search);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGenerations(1, search);
  };

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this generation from your history?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/user/generations/${id}`);
      setGenerations(generations.filter(g => g.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Generation History</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse, search, and reuse your past captions and hashtag collections.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic or hook..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* History Items */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No records found</h3>
          <p className="text-xs text-slate-500 mt-1">Try another search term or generate your first caption.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {generations.map((gen) => (
            <div
              key={gen.id}
              className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-2xl space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-purple-950/60 border border-purple-500/20 text-purple-300 text-[11px] font-bold rounded-md uppercase">
                    {gen.tone}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[11px] font-medium rounded-md">
                    {gen.language}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 ml-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(gen.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(gen)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                  >
                    {copiedId === gen.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Post</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(gen.id)}
                    disabled={deletingId === gen.id}
                    title="Delete generation"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hook */}
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Hook</p>
                <p className="text-sm font-bold text-white leading-relaxed">{gen.hook}</p>
              </div>

              {/* Caption */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Caption</p>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {gen.caption}
                </p>
              </div>

              {/* Hashtag Snippets */}
              {gen.hashtags && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-purple-400" />
                    Hashtags ({((gen.hashtags.high?.length || 0) + (gen.hashtags.medium?.length || 0) + (gen.hashtags.niche?.length || 0))})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[...(gen.hashtags.high || []), ...(gen.hashtags.medium || []), ...(gen.hashtags.niche || [])].slice(0, 15).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchGenerations(pagination.page - 1, search)}
              disabled={pagination.page <= 1}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:text-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchGenerations(pagination.page + 1, search)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:text-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
