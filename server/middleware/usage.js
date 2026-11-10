import { supabaseAdmin } from '../config/supabase.js';

/**
 * Checks if the user is within their monthly generation allowance.
 * Enforces dynamic limits retrieved from the `plans` table.
 * Automatically handles monthly reset if reset_at has passed.
 * Returns HTTP 402 Payment Required if limit is exhausted.
 */
export async function checkLimit(req, res, next) {
  try {
    const userId = req.user.id;

    // 1. Fetch current usage profile
    const { data: usage, error: usageErr } = await supabaseAdmin
      .from('usage')
      .select('plan, count_this_month, reset_at')
      .eq('user_id', userId)
      .single();

    if (usageErr && usageErr.code !== 'PGRST116') {
      console.error('Usage check error:', usageErr);
    }

    let planId = usage?.plan || 'free';
    let currentCount = usage?.count_this_month || 0;
    let resetAt = usage?.reset_at ? new Date(usage.reset_at) : null;
    const now = new Date();

    // 2. Check for monthly reset
    if (resetAt && now >= resetAt) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      currentCount = 0;
      await supabaseAdmin
        .from('usage')
        .upsert({
          user_id: userId,
          plan: planId,
          count_this_month: 0,
          reset_at: nextReset.toISOString()
        });
    }

    // 3. Fetch plan specifications dynamically from the plans table
    const { data: planDoc, error: planErr } = await supabaseAdmin
      .from('plans')
      .select('name, monthly_limit, is_active')
      .eq('id', planId)
      .single();

    const planName = planDoc?.name || (planId === 'pro' ? 'Pro Creator' : 'Free Creator');
    const monthlyLimit = planDoc ? planDoc.monthly_limit : (planId === 'pro' ? -1 : 5);

    // If monthlyLimit is -1, it is unlimited
    if (monthlyLimit !== -1 && currentCount >= monthlyLimit) {
      return res.status(402).json({
        error: `Monthly generation limit reached (${currentCount}/${monthlyLimit}) on your ${planName} plan. Upgrade to Pro for unlimited generations.`,
        code: 'LIMIT_REACHED',
        currentCount,
        monthlyLimit,
        plan: planId
      });
    }

    // Pass details along request
    req.userUsage = { planId, currentCount, monthlyLimit };
    next();
  } catch (err) {
    console.error('checkLimit middleware failed:', err);
    // Allow pass-through if usage service encounters transient error
    next();
  }
}

/**
 * Increments generation count strictly upon successful generation
 */
export async function incrementUsage(userId) {
  try {
    const { data: usage } = await supabaseAdmin
      .from('usage')
      .select('count_this_month')
      .eq('user_id', userId)
      .single();

    const newCount = (usage?.count_this_month || 0) + 1;

    await supabaseAdmin
      .from('usage')
      .update({ count_this_month: newCount })
      .eq('user_id', userId);

    return newCount;
  } catch (err) {
    console.error('Failed to increment usage:', err.message);
    return null;
  }
}
