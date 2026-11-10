import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Guards & Layouts
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Landing from './pages/public/Landing';
import Pricing from './pages/public/Pricing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import Forbidden from './pages/public/Forbidden';
import NotFound from './pages/public/NotFound';

// User Portal Pages
import Dashboard from './pages/user/Dashboard';
import Generate from './pages/user/Generate';
import History from './pages/user/History';
import SavedSets from './pages/user/SavedSets';
import Billing from './pages/user/Billing';
import Settings from './pages/user/Settings';

// Admin Panel Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminGenerations from './pages/admin/AdminGenerations';
import AdminHashtagLibrary from './pages/admin/AdminHashtagLibrary';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPlans from './pages/admin/AdminPlans';
import AdminReports from './pages/admin/AdminReports';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forbidden" element={<Forbidden />} />

          {/* User Portal Routes (Protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<UserLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="generate" element={<Generate />} />
              <Route path="history" element={<History />} />
              <Route path="saved-sets" element={<SavedSets />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Admin Panel Routes (Protected by Admin Clearance) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="generations" element={<AdminGenerations />} />
              <Route path="hashtags" element={<AdminHashtagLibrary />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
