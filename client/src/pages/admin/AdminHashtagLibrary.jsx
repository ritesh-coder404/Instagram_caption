import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Hash,
  Plus,
  Upload,
  Search,
  Check,
  X,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AdminHashtagLibrary() {
  const [hashtags, setHashtags] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State for Single Hashtag (Create / Edit)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formTag, setFormTag] = useState('');
  const [formNiche, setFormNiche] = useState('tech');
  const [formSize, setFormSize] = useState('medium');
  const [formActive, setFormActive] = useState(true);
  const [savingSingle, setSavingSingle] = useState(false);

  // Bulk Import Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkNiche, setBulkNiche] = useState('tech');
  const [bulkSize, setBulkSize] = useState('niche');
  const [savingBulk, setSavingBulk] = useState(false);

  const niches = ['fitness', 'food', 'tech', 'travel', 'fashion', 'business', 'comedy', 'education'];
  const sizes = ['high', 'medium', 'niche'];

  const fetchHashtags = async (page = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search.trim()) q.append('search', search.trim());
      if (nicheFilter) q.append('niche', nicheFilter);
      if (sizeFilter) q.append('size', sizeFilter);

      const res = await api.get(`/admin/hashtags?${q.toString()}`);
      setHashtags(res.hashtags || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load hashtags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHashtags(1);
  }, [nicheFilter, sizeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHashtags(1);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTag('');
    setFormNiche(nicheFilter || 'tech');
    setFormSize('medium');
    setFormActive(true);
    setEditModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTag(item.tag);
    setFormNiche(item.niche);
    setFormSize(item.size);
    setFormActive(item.is_active);
    setEditModalOpen(true);
  };

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!formTag.trim()) return;
    setSavingSingle(true);

    try {
      if (editingItem) {
        const res = await api.put(`/admin/hashtags/${editingItem.id}`, {
          tag: formTag,
          niche: formNiche,
          size: formSize,
          is_active: formActive
        });
        setHashtags(hashtags.map(h => h.id === editingItem.id ? res.hashtag : h));
      } else {
        const res = await api.post('/admin/hashtags', {
          tag: formTag,
          niche: formNiche,
          size: formSize,
          is_active: formActive
        });
        setHashtags([res.hashtag, ...hashtags]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }
      setEditModalOpen(false);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSavingSingle(false);
    }
  };

  const handleToggleActive = async (item) => {
    const nextState = !item.is_active;
    try {
      await api.put(`/admin/hashtags/${item.id}`, { is_active: nextState });
      setHashtags(hashtags.map(h => h.id === item.id ? { ...h, is_active: nextState } : h));
    } catch (err) {
      alert('Toggle failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hashtag from the library?')) return;
    try {
      await api.delete(`/admin/hashtags/${id}`);
      setHashtags(hashtags.filter(h => h.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    const rawList = bulkText.split(/[\n,]+/).map(t => t.trim()).filter(Boolean);
    if (rawList.length === 0) return;

    setSavingBulk(true);
    try {
      const items = rawList.map(tag => ({
        tag,
        niche: bulkNiche,
        size: bulkSize,
        is_active: true
      }));

      const res = await api.post('/admin/hashtags/bulk', { items });
      alert(`Successfully imported ${res.count} hashtags!`);
      setBulkModalOpen(false);
      setBulkText('');
      fetchHashtags(1);
    } catch (err) {
      alert('Bulk import error: ' + err.message);
    } finally {
      setSavingBulk(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Hashtag Library & Optimization</h1>
          <p className="text-slate-400 text-xs mt-1">
            Curate active high, medium, and niche hashtags used by the AI engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk CSV / Text</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hashtag</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-indigo-950 p-4 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search #tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Niches</option>
            {niches.map(n => <option key={n} value={n} className="capitalize">{n}</option>)}
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Tiers</option>
            <option value="high">High-Reach</option>
            <option value="medium">Medium</option>
            <option value="niche">Niche</option>
          </select>
        </div>
      </div>

      {/* Hashtags Table */}
      <div className="bg-slate-900 border border-indigo-950/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-indigo-950/80 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-6">Hashtag</th>
                <th className="py-3 px-6">Niche</th>
                <th className="py-3 px-6">Tier Size</th>
                <th className="py-3 px-6">Active</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading hashtag catalog...
                  </td>
                </tr>
              ) : hashtags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No hashtags matched the selected filters.
                  </td>
                </tr>
              ) : (
                hashtags.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30 transition text-slate-300">
                    <td className="py-3 px-6 font-mono font-bold text-white">{h.tag}</td>
                    <td className="py-3 px-6 capitalize text-slate-400">{h.niche}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        h.size === 'high'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : h.size === 'medium'
                          ? 'bg-sky-500/10 text-sky-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {h.size}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <button
                        onClick={() => handleToggleActive(h)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                          h.is_active
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {h.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{h.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(h)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} hashtags)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchHashtags(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 bg-slate-800 rounded-lg hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchHashtags(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 bg-slate-800 rounded-lg hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Hashtag Modal (Create / Edit) */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingItem ? 'Edit Hashtag' : 'Add New Hashtag'}
              </h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Hashtag Tag
                </label>
                <input
                  type="text"
                  placeholder="#instafit"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Niche
                  </label>
                  <select
                    value={formNiche}
                    onChange={(e) => setFormNiche(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none capitalize"
                  >
                    {niches.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tier Size
                  </label>
                  <select
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none uppercase"
                  >
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-check"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="active-check" className="text-xs text-slate-300 select-none">
                  Active for AI selection
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSingle}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  {savingSingle ? 'Saving...' : 'Save Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Bulk Hashtag Import</h2>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Niche
                  </label>
                  <select
                    value={bulkNiche}
                    onChange={(e) => setBulkNiche(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white capitalize"
                  >
                    {niches.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tier Size
                  </label>
                  <select
                    value={bulkSize}
                    onChange={(e) => setBulkSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white uppercase"
                  >
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Paste Hashtags (Line or Comma separated)
                </label>
                <textarea
                  rows={5}
                  placeholder="#reels #explore #viral #instagramcreator"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBulk}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  {savingBulk ? 'Importing...' : 'Execute Bulk Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
