import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  BookmarkCheck,
  Plus,
  Copy,
  Check,
  Trash2,
  Layers,
  X
} from 'lucide-react';

export default function SavedSets() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // New Set Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [rawTags, setRawTags] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSets = async () => {
    setLoading(true);
    try {
      const data = await api.get('/user/saved-sets');
      setSets(data || []);
    } catch (err) {
      console.error('Failed to load saved sets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleCopyTags = (setId, tags) => {
    const text = (tags || []).join(' ');
    navigator.clipboard.writeText(text);
    setCopiedId(setId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hashtag set?')) return;
    try {
      await api.delete(`/user/saved-sets/${id}`);
      setSets(sets.filter(s => s.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCreateSet = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = rawTags
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : '#' + t);

    if (tags.length === 0) {
      alert('Please enter at least one hashtag.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/user/saved-sets', {
        name: name.trim(),
        hashtags: tags
      });

      if (res.savedSet) {
        setSets([res.savedSet, ...sets]);
        setShowModal(false);
        setName('');
        setRawTags('');
      }
    } catch (err) {
      alert('Failed to create set: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Saved Hashtag Sets</h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize your highest-performing hashtag groups for 1-click reel posting.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Hashtag Set</span>
        </button>
      </div>

      {/* Grid of Sets */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <BookmarkCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No saved sets yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create custom sets or save them directly from the Generate results card.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition"
          >
            Create Your First Set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sets.map(s => (
            <div
              key={s.id}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base truncate">{s.name}</h3>
                  <span className="text-[11px] text-purple-400 bg-purple-950/60 border border-purple-500/20 px-2 py-0.5 rounded-md font-semibold">
                    {s.hashtags?.length || 0} tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                  {(s.hashtags || []).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">
                  Created {new Date(s.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyTags(s.id, s.hashtags)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                  >
                    {copiedId === s.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Set Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create New Hashtag Set</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Collection Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily Fitness Reels, Tech Shorts, Fashion Hauls"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Hashtags (Space or comma separated)
                </label>
                <textarea
                  rows={4}
                  placeholder="#fitness #gymlife #reels #bodybuilding #homeworkout"
                  value={rawTags}
                  onChange={(e) => setRawTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition"
                >
                  {saving ? 'Saving...' : 'Save Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
