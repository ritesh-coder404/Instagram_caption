import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Edit,
  RotateCcw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function AdminUsers() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPlan, setEditPlan] = useState('free');
  const [editCount, setEditCount] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page, limit: 15 });
      if (search.trim()) q.append('search', search.trim());
      if (statusFilter) q.append('status', statusFilter);
      if (planFilter) q.append('plan', planFilter);

      const res = await api.get(`/admin/users?${q.toString()}`);
      setUsers(res.users || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatus = async (user) => {
    if (user.id === currentAdmin.id) {
      alert('Security Protection: You cannot suspend your own administrative account.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change status of ${user.email} to ${nextStatus}?`)) return;

    try {
      await api.put(`/admin/users/${user.id}/status`, { status: nextStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditPlan(user.usage?.plan || 'free');
    setEditCount(user.usage?.count_this_month || 0);
  };

  const handleSavePlanOverride = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingEdit(true);

    try {
      await api.put(`/admin/users/${selectedUser.id}/plan`, {
        plan: editPlan,
        count_this_month: parseInt(editCount) || 0
      });

      setUsers(users.map(u => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            usage: {
              ...u.usage,
              plan: editPlan,
              count_this_month: parseInt(editCount) || 0
            }
          };
        }
        return u;
      }));

      setSelectedUser(null);
    } catch (err) {
      alert('Plan update failed: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetUsage = async (userId) => {
    if (!window.confirm('Reset this user\'s monthly generation usage count to 0?')) return;
    try {
      await api.put(`/admin/users/${userId}/plan`, { count_this_month: 0 });
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { ...u, usage: { ...u.usage, count_this_month: 0 } };
        }
        return u;
      }));
    } catch (err) {
      alert('Usage reset failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">User Management</h1>
          <p className="text-slate-400 text-xs mt-1">Audit user accounts, modify plan limits, and manage status.</p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Plans</option>
            <option value="free">Free Plan</option>
            <option value="pro">Pro Plan</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-indigo-950/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-indigo-950/80 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Plan & Usage</th>
                <th className="py-4 px-6">Joined</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition text-slate-300">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{u.full_name || 'Anonymous Creator'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-indigo-500/10 text-cyan-400 border border-indigo-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white capitalize">{u.usage?.plan || 'free'}</div>
                      <div className="text-[11px] text-slate-400">
                        {u.usage?.count_this_month ?? 0} used this mo
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Plan / Usage */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Modify Plan & Usage"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Count */}
                        <button
                          onClick={() => handleResetUsage(u.id)}
                          title="Reset Usage Count"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspend / Activate (Disabled for current self admin) */}
                        {u.id !== currentAdmin.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg transition ${
                              u.status === 'active'
                                ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/50'
                                : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50'
                            }`}
                          >
                            {u.status === 'active' ? <ShieldAlert className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 bg-slate-800 rounded-lg hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 bg-slate-800 rounded-lg hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Plan & Usage Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Adjust Plan & Usage</h2>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Target User: <span className="font-bold text-white">{selectedUser.email}</span>
            </p>

            <form onSubmit={handleSavePlanOverride} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Plan Tier
                </label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="free">Free Creator (5/month)</option>
                  <option value="pro">Pro Creator (Unlimited)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Monthly Generation Count Override
                </label>
                <input
                  type="number"
                  min="0"
                  value={editCount}
                  onChange={(e) => setEditCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  {savingEdit ? 'Updating...' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
