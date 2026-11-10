import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../config/supabase.js';

const router = Router();

// Protect ALL routes in this file with both requireAuth and requireAdmin
router.use(requireAuth, requireAdmin);

/**
 * Helper to record all administrative actions into admin_logs
 */
async function recordAdminLog(adminId, action, target, meta = {}) {
  try {
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        target,
        meta
      });
  } catch (err) {
    console.error('Failed to write admin log:', err.message);
  }
}

// ==============================================================================
// 1. ADMIN DASHBOARD & ANALYTICS
// ==============================================================================

/**
 * GET /api/admin/dashboard
 * Aggregates SaaS metrics & chart time-series data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. User stats
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: users7Days } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    const { count: users30Days } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo);

    // 2. Pro Users
    const { count: proUsers } = await supabaseAdmin
      .from('usage')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'pro');

    // 3. Generations count
    const { count: totalGenerations } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true });

    // 4. Revenue calculation from captured payments
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount, status, created_at')
      .eq('status', 'captured');

    const totalRevenue = (payments || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 5. Chart Data: Signups over last 7 days
    const { data: recentProfiles } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .gte('created_at', sevenDaysAgo);

    const signupsByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      signupsByDay[d] = 0;
    }
    (recentProfiles || []).forEach(p => {
      const d = p.created_at?.split('T')[0];
      if (signupsByDay[d] !== undefined) signupsByDay[d]++;
    });
    const signupsChart = Object.keys(signupsByDay).map(date => ({ date, signups: signupsByDay[date] }));

    // 6. Chart Data: Generations per day
    const { data: recentGens } = await supabaseAdmin
      .from('generations')
      .select('created_at')
      .gte('created_at', sevenDaysAgo);

    const gensByDay = {};
    Object.keys(signupsByDay).forEach(d => { gensByDay[d] = 0; });
    (recentGens || []).forEach(g => {
      const d = g.created_at?.split('T')[0];
      if (gensByDay[d] !== undefined) gensByDay[d]++;
    });
    const generationsChart = Object.keys(gensByDay).map(date => ({ date, generations: gensByDay[date] }));

    // 7. Plan Distribution Split
    const planDistribution = [
      { name: 'Free Users', count: Math.max((totalUsers || 0) - (proUsers || 0), 0) },
      { name: 'Pro Users', count: proUsers || 0 }
    ];

    // Estimated Gemini API Cost ($0.0001 per generation average)
    const estimatedApiCostUSD = Number(((totalGenerations || 0) * 0.0001).toFixed(4));

    return res.json({
      metrics: {
        totalUsers: totalUsers || 0,
        users7Days: users7Days || 0,
        users30Days: users30Days || 0,
        proUsers: proUsers || 0,
        totalGenerations: totalGenerations || 0,
        totalRevenueINR: totalRevenue,
        estimatedApiCostUSD
      },
      charts: {
        signups: signupsChart,
        generations: generationsChart,
        plans: planDistribution
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'Failed to aggregate administrative metrics.' });
  }
});

// ==============================================================================
// 2. USER MANAGEMENT
// ==============================================================================

/**
 * GET /api/admin/users
 * Searchable, filterable list of all registered users with their live usage
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search?.trim();
    const status = req.query.status;
    const plan = req.query.plan;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: users, count, error } = await query;
    if (error) throw error;

    // Attach usage details for each user
    const userIds = (users || []).map(u => u.id);
    const { data: usages } = await supabaseAdmin
      .from('usage')
      .select('user_id, plan, count_this_month, reset_at')
      .in('user_id', userIds);

    const usageMap = (usages || []).reduce((acc, u) => {
      acc[u.user_id] = u;
      return acc;
    }, {});

    const enrichedUsers = (users || []).map(u => ({
      ...u,
      usage: usageMap[u.id] || { plan: 'free', count_this_month: 0 }
    }));

    // Filter by plan if requested
    const filteredUsers = plan 
      ? enrichedUsers.filter(u => u.usage.plan === plan)
      : enrichedUsers;

    return res.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Admin users fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Suspend or activate user. Admin cannot suspend self.
 */
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const targetUserId = req.params.id;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'active' or 'suspended'." });
    }

    // Safety rule: Admin cannot suspend their own account
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Security restriction: You cannot suspend your own administrative account.' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ status })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    await recordAdminLog(req.user.id, `USER_${status.toUpperCase()}`, `user:${targetUserId}`, { status });

    return res.json({ success: true, user: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to modify user status.' });
  }
});

/**
 * PUT /api/admin/users/:id/plan
 * Manually update plan or reset monthly usage count
 */
router.put('/users/:id/plan', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { plan, count_this_month } = req.body;

    const updates = {};
    if (plan !== undefined) updates.plan = plan;
    if (count_this_month !== undefined) updates.count_this_month = count_this_month;

    const { data, error } = await supabaseAdmin
      .from('usage')
      .upsert({
        user_id: targetUserId,
        ...updates
      })
      .select()
      .single();

    if (error) throw error;

    await recordAdminLog(req.user.id, 'USER_PLAN_OVERRIDE', `user:${targetUserId}`, updates);

    return res.json({ success: true, usage: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user plan allocation.' });
  }
});

// ==============================================================================
// 3. GENERATIONS MODERATION
// ==============================================================================

/**
 * GET /api/admin/generations
 */
router.get('/generations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search?.trim();
    const flaggedOnly = req.query.flagged === 'true';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('generations')
      .select('*, profiles:user_id(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (flaggedOnly) {
      query = query.eq('is_flagged', true);
    }
    if (search) {
      query = query.or(`topic.ilike.%${search}%,hook.ilike.%${search}%,caption.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return res.json({
      generations: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve generations.' });
  }
});

/**
 * PUT /api/admin/generations/:id/flag
 */
router.put('/generations/:id/flag', async (req, res) => {
  try {
    const { is_flagged } = req.body;
    const { data, error } = await supabaseAdmin
      .from('generations')
      .update({ is_flagged: Boolean(is_flagged) })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await recordAdminLog(req.user.id, 'GENERATION_FLAG_TOGGLE', `generation:${req.params.id}`, { is_flagged });

    return res.json({ success: true, generation: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update flag.' });
  }
});

/**
 * DELETE /api/admin/generations/:id
 */
router.delete('/generations/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('generations')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await recordAdminLog(req.user.id, 'GENERATION_DELETED', `generation:${req.params.id}`);

    return res.json({ success: true, message: 'Content deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete generation.' });
  }
});

// ==============================================================================
// 4. HASHTAG LIBRARY CRUD & BULK IMPORT
// ==============================================================================

/**
 * GET /api/admin/hashtags
 */
router.get('/hashtags', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const niche = req.query.niche?.trim();
    const size = req.query.size?.trim();
    const search = req.query.search?.trim();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('hashtags')
      .select('*', { count: 'exact' })
      .order('niche', { ascending: true })
      .order('tag', { ascending: true })
      .range(from, to);

    if (niche) query = query.ilike('niche', `%${niche}%`);
    if (size) query = query.eq('size', size);
    if (search) query = query.ilike('tag', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return res.json({
      hashtags: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch hashtags.' });
  }
});

/**
 * POST /api/admin/hashtags
 */
router.post('/hashtags', async (req, res) => {
  try {
    let { tag, niche, size, is_active = true } = req.body;
    if (!tag || !niche || !size) {
      return res.status(400).json({ error: 'tag, niche, and size (high|medium|niche) are required.' });
    }

    tag = tag.trim();
    if (!tag.startsWith('#')) tag = '#' + tag;

    const { data, error } = await supabaseAdmin
      .from('hashtags')
      .insert({
        tag,
        niche: niche.toLowerCase().trim(),
        size: size.toLowerCase().trim(),
        is_active: Boolean(is_active)
      })
      .select()
      .single();

    if (error) throw error;

    await recordAdminLog(req.user.id, 'HASHTAG_CREATED', `tag:${data.id}`, { tag, niche, size });

    return res.json({ success: true, hashtag: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create hashtag.' });
  }
});

/**
 * POST /api/admin/hashtags/bulk
 * Bulk CSV/JSON import of hashtags
 */
router.post('/hashtags/bulk', async (req, res) => {
  try {
    const { items } = req.body; // Array of { tag, niche, size, is_active }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Array of hashtag objects required.' });
    }

    const cleanedItems = items.map(item => {
      let t = (item.tag || '').trim();
      if (!t.startsWith('#')) t = '#' + t;
      return {
        tag: t,
        niche: (item.niche || 'general').toLowerCase().trim(),
        size: ['high', 'medium', 'niche'].includes(item.size) ? item.size : 'medium',
        is_active: item.is_active !== false
      };
    }).filter(i => i.tag.length > 1);

    const { data, error } = await supabaseAdmin
      .from('hashtags')
      .upsert(cleanedItems, { onConflict: 'tag' })
      .select();

    if (error) throw error;

    await recordAdminLog(req.user.id, 'HASHTAGS_BULK_IMPORT', 'hashtags', { count: cleanedItems.length });

    return res.json({ success: true, count: data?.length || 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Bulk import failed.' });
  }
});

/**
 * PUT /api/admin/hashtags/:id
 */
router.put('/hashtags/:id', async (req, res) => {
  try {
    const { tag, niche, size, is_active } = req.body;
    const updates = {};
    if (tag) updates.tag = tag.startsWith('#') ? tag : '#' + tag;
    if (niche) updates.niche = niche.toLowerCase().trim();
    if (size) updates.size = size.toLowerCase().trim();
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('hashtags')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await recordAdminLog(req.user.id, 'HASHTAG_UPDATED', `hashtag:${req.params.id}`, updates);

    return res.json({ success: true, hashtag: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update hashtag.' });
  }
});

/**
 * DELETE /api/admin/hashtags/:id
 */
router.delete('/hashtags/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('hashtags')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await recordAdminLog(req.user.id, 'HASHTAG_DELETED', `hashtag:${req.params.id}`);

    return res.json({ success: true, message: 'Hashtag deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete hashtag.' });
  }
});

// ==============================================================================
// 5. PAYMENTS AUDIT & PLANS MANAGEMENT
// ==============================================================================

/**
 * GET /api/admin/payments
 */
router.get('/payments', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, profiles:user_id(email, full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve payments.' });
  }
});

/**
 * GET /api/admin/plans
 */
router.get('/plans', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .order('price_inr', { ascending: true });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load plans.' });
  }
});

/**
 * PUT /api/admin/plans/:id
 * Updates price, limit, and status with immediate user-side effect
 */
router.put('/plans/:id', async (req, res) => {
  try {
    const { name, price_inr, monthly_limit, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price_inr !== undefined) updates.price_inr = parseInt(price_inr);
    if (monthly_limit !== undefined) updates.monthly_limit = parseInt(monthly_limit);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data, error } = await supabaseAdmin
      .from('plans')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await recordAdminLog(req.user.id, 'PLAN_CONFIG_MODIFIED', `plan:${req.params.id}`, updates);

    return res.json({ success: true, plan: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update plan configuration.' });
  }
});

// ==============================================================================
// 6. SYSTEM AUDIT LOGS & REPORTS
// ==============================================================================

/**
 * GET /api/admin/logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_logs')
      .select('*, profiles:admin_id(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load admin logs.' });
  }
});

export default router;
