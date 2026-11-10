import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware: Verifies the Supabase JWT token from the Authorization header.
 * - Extracts user ID securely from auth.getUser(token)
 * - Checks status from profiles table (Blocks suspended users)
 * - Populates req.user
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT against Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Fetch live profile status and role from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, status, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // Block suspended users
    if (profile && profile.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user',
      status: profile?.status || 'active',
      full_name: profile?.full_name || '',
      token
    };

    next();
  } catch (err) {
    console.error('requireAuth unexpected error:', err);
    return res.status(500).json({ error: 'Authentication validation failed.' });
  }
}

/**
 * Middleware: Enforces that the authenticated user possesses the 'admin' role.
 * Queries the profiles table directly on every admin request for live verification.
 */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Direct database check on profiles table to prevent spoofing or stale tokens
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role, status')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin' || profile.status !== 'active') {
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to access the administrative panel.' 
      });
    }

    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    return res.status(500).json({ error: 'Failed to verify admin privileges.' });
  }
}
