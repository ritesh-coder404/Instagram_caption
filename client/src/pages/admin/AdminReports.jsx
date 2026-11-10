import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  FileSpreadsheet,
  Download,
  Shield,
  Clock,
  User,
  Activity,
  Layers
} from 'lucide-react';

export default function AdminReports() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingUsers, setExportingUsers] = useState(false);
  const [exportingGens, setExportingGens] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await api.get('/admin/logs');
        setLogs(data || []);
      } catch (err) {
        console.error('Failed to load admin logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const handleExportUsers = async () => {
    setExportingUsers(true);
    try {
      const res = await api.get('/admin/users?limit=1000');
      const usersList = res.users || [];
      const headers = ['ID,Email,Full Name,Role,Status,Plan,Usage Count,Created At'];
      const rows = usersList.map(u =>
        `"${u.id}","${u.email}","${u.full_name || ''}","${u.role}","${u.status}","${u.usage?.plan || 'free'}","${u.usage?.count_this_month || 0}","${u.created_at}"`
      );
      const csv = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      downloadBlob(csv, `captioncraft_users_${Date.now()}.csv`);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExportingUsers(false);
    }
  };

  const handleExportGenerations = async () => {
    setExportingGens(true);
    try {
      const res = await api.get('/admin/generations?limit=1000');
      const gens = res.generations || [];
      const headers = ['ID,User Email,Topic,Tone,Language,Hook,Flagged,Created At'];
      const rows = gens.map(g =>
        `"${g.id}","${g.profiles?.email || g.user_id}","${g.topic.replace(/"/g, '""')}","${g.tone}","${g.language}","${g.hook.replace(/"/g, '""')}","${g.is_flagged}","${g.created_at}"`
      );
      const csv = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      downloadBlob(csv, `captioncraft_generations_${Date.now()}.csv`);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExportingGens(false);
    }
  };

  const downloadBlob = (content, filename) => {
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white">Reports & Security Audit Trail</h1>
        <p className="text-slate-400 text-xs mt-1">
          Export compliance records and inspect all administrative actions stored in `admin_logs`.
        </p>
      </div>

      {/* Export Options Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 bg-slate-900 border border-indigo-950/80 rounded-3xl flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Creators Database Export</h3>
            <p className="text-xs text-slate-400 mt-1">Full registered creator list with status and usage</p>
          </div>
          <button
            onClick={handleExportUsers}
            disabled={exportingUsers}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingUsers ? 'Exporting...' : 'Export Users'}</span>
          </button>
        </div>

        <div className="p-6 bg-slate-900 border border-indigo-950/80 rounded-3xl flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Generations & Moderation Export</h3>
            <p className="text-xs text-slate-400 mt-1">Full generated reels copy and moderation flags</p>
          </div>
          <button
            onClick={handleExportGenerations}
            disabled={exportingGens}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingGens ? 'Exporting...' : 'Export Content'}</span>
          </button>
        </div>
      </div>

      {/* Admin Audit Logs Table */}
      <div className="bg-slate-900 border border-indigo-950/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-indigo-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Immutable Administrative Audit Log</h2>
          </div>
          <span className="text-xs text-slate-500">Last 100 recorded operations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-indigo-950/80 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Admin</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Target</th>
                <th className="py-3 px-6">Metadata Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No admin actions recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition text-slate-300">
                    <td className="py-3 px-6 text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 font-semibold text-white">
                      {log.profiles?.email || 'System'}
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-cyan-300 font-mono text-[11px] font-bold rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-mono text-slate-400">{log.target}</td>
                    <td className="py-3 px-6 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.meta)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
