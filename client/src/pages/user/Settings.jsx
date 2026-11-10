import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import {
  User,
  Lock,
  Shield,
  Check,
  AlertCircle,
  LogOut,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Name State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [updatingName, setUpdatingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setUpdatingName(true);
    setNameMsg('');
    try {
      await api.put('/user/profile', { full_name: fullName.trim() });
      await refreshProfile();
      setNameMsg('Profile name updated successfully!');
      setTimeout(() => setNameMsg(''), 3000);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setUpdatingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMsg({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Password update failed.', type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Account Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal information, security preferences, and account credentials.
        </p>
      </div>

      {/* Profile Information Form */}
      <div className="p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <User className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Personal Information</h2>
        </div>

        {nameMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{nameMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ritesh Sharma"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updatingName}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>{updatingName ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password */}
      <div className="p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <Lock className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Change Password</h2>
        </div>

        {passwordMsg.text && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            passwordMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {passwordMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updatingPassword || !newPassword}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info & Logout */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Sign Out</h3>
          <p className="text-xs text-slate-400 mt-0.5">End your current session on this device.</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-xl transition flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
