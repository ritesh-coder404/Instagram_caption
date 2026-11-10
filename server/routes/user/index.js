import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { checkLimit, incrementUsage } from '../../middleware/usage.js';
import { generateCaptionFromText } from '../../services/gemini.js';
import { getEnhancedHashtags } from '../../services/hashtags.js';
import { processVideoJob } from '../../services/video.js';
import { createRazorpayOrder, createCashfreeUPIOrder, confirmUPIPayment } from '../../services/payments.js';
import { supabaseAdmin } from '../../config/supabase.js';

const router = Router();

// ==============================================================================
// 1. GENERATION ROUTES
// ==============================================================================

/**
 * POST /api/generate
 * Text-to-Caption generation with hashtag tiering
 */
router.post('/generate', requireAuth, checkLimit, async (req, res) => {
  try {
    const { topic, tone = 'professional', language = 'English' } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'A valid topic or theme is required.' });
    }

    // 1. Generate text and preliminary hashtags from LLM
    const llmResult = await generateCaptionFromText({ topic, tone, language });

    // 2. Enhance with curated DB hashtag library
    const enhancedHashtags = await getEnhancedHashtags({
      niche: llmResult.niche,
      topic,
      llmHashtags: llmResult.hashtags
    });

    // 3. Save generation record
    const { data: generation, error: dbErr } = await supabaseAdmin
      .from('generations')
      .insert({
        user_id: req.user.id,
        topic: topic.trim(),
        tone,
        language,
        hook: llmResult.hook,
        caption: llmResult.caption,
        hashtags: enhancedHashtags
      })
      .select()
      .single();

    if (dbErr) {
      console.error('Generations insert error:', dbErr);
      throw new Error('Database failed to save generated content.');
    }

    // 4. Increment usage counter
    await incrementUsage(req.user.id);

    return res.json({
      success: true,
      generation
    });
  } catch (err) {
    console.error('Generation endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Generation failed. Please try again.' });
  }
});

/**
 * POST /api/generate-from-video
 * Initiates asynchronous video processing job
 */
router.post('/generate-from-video', requireAuth, checkLimit, async (req, res) => {
  try {
    const { storagePath, videoUrl, tone = 'professional', language = 'English' } = req.body;

    if (!storagePath) {
      return res.status(400).json({ error: 'Video storage path is required.' });
    }

    // 1. Create job entry
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('jobs')
      .insert({
        user_id: req.user.id,
        status: 'processing'
      })
      .select()
      .single();

    if (jobErr || !job) {
      throw new Error('Failed to create background processing job.');
    }

    // 2. Run video processing asynchronously (does not block HTTP response)
    processVideoJob(job.id, req.user.id, {
      storagePath,
      videoUrl,
      tone,
      language
    }).catch(e => console.error('Background video task failed:', e));

    return res.json({
      success: true,
      jobId: job.id,
      status: 'processing'
    });
  } catch (err) {
    console.error('Video generation initiation error:', err);
    return res.status(500).json({ error: err.message || 'Video job initiation failed.' });
  }
});

/**
 * GET /api/jobs/:id
 * Poll job status
 */
router.get('/jobs/:id', requireAuth, async (req, res) => {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select('id, status, result, error, created_at')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch job status.' });
  }
});

// ==============================================================================
// 2. USER DASHBOARD & GENERATIONS
// ==============================================================================

/**
 * GET /api/user/dashboard
 * Summary stats for user portal home
 */
router.get('/user/dashboard', requireAuth, async (req, res) => {
  try {
    // 1. Usage & plan details
    const { data: usage } = await supabaseAdmin
      .from('usage')
      .select('plan, count_this_month, reset_at')
      .eq('user_id', req.user.id)
      .single();

    const planId = usage?.plan || 'free';
    const { data: planInfo } = await supabaseAdmin
      .from('plans')
      .select('name, monthly_limit')
      .eq('id', planId)
      .single();

    // 2. Recent 5 generations
    const { data: recentGenerations } = await supabaseAdmin
      .from('generations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Total generation count
    const { count: totalGenerations } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        status: req.user.status
      },
      usage: {
        plan: planId,
        planName: planInfo?.name || (planId === 'pro' ? 'Pro Creator' : 'Free Creator'),
        countThisMonth: usage?.count_this_month || 0,
        monthlyLimit: planInfo?.monthly_limit ?? (planId === 'pro' ? -1 : 5),
        resetAt: usage?.reset_at,
        totalGenerations: totalGenerations || 0
      },
      recentGenerations: recentGenerations || []
    });
  } catch (err) {
    console.error('Dashboard stats fetch error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard data.' });
  }
});

/**
 * GET /api/user/generations
 * Searchable, paginated history of past generations
 */
router.get('/user/generations', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

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
    console.error('Generations list error:', err);
    return res.status(500).json({ error: 'Failed to load generations.' });
  }
});

/**
 * DELETE /api/user/generations/:id
 */
router.delete('/user/generations/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('generations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    return res.json({ success: true, message: 'Generation deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete generation.' });
  }
});

// ==============================================================================
// 3. SAVED SETS
// ==============================================================================

/**
 * GET /api/user/saved-sets
 */
router.get('/user/saved-sets', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('saved_sets')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch saved sets.' });
  }
});

/**
 * POST /api/user/saved-sets
 */
router.post('/user/saved-sets', requireAuth, async (req, res) => {
  try {
    const { name, hashtags } = req.body;
    if (!name || !hashtags || !Array.isArray(hashtags)) {
      return res.status(400).json({ error: 'Set name and array of hashtags required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('saved_sets')
      .insert({
        user_id: req.user.id,
        name: name.trim(),
        hashtags
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, savedSet: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save hashtag set.' });
  }
});

/**
 * DELETE /api/user/saved-sets/:id
 */
router.delete('/user/saved-sets/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('saved_sets')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    return res.json({ success: true, message: 'Saved set deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete saved set.' });
  }
});

// ==============================================================================
// 4. USER SETTINGS & BILLING
// ==============================================================================

/**
 * PUT /api/user/profile
 * Updates full_name ONLY. Strictly prohibits role or status mutation.
 */
router.put('/user/profile', requireAuth, async (req, res) => {
  try {
    const { full_name } = req.body;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: full_name?.trim() || '' })
      .eq('id', req.user.id)
      .select('id, email, full_name, role, status')
      .single();

    if (error) throw error;
    return res.json({ success: true, profile: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * POST /api/payments/create-order
 * Initiates Razorpay test mode payment
 */
router.post('/payments/create-order', requireAuth, async (req, res) => {
  try {
    const { planId = 'pro' } = req.body;
    const order = await createRazorpayOrder({ userId: req.user.id, planId });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Order generation failed.' });
  }
});

/**
 * POST /api/payments/create-upi-order
 * Initiates Direct Indian UPI & QR Code Order (PhonePe, GPay, Paytm, Cashfree)
 */
router.post('/payments/create-upi-order', requireAuth, async (req, res) => {
  try {
    const { planId = 'pro' } = req.body;
    const order = await createCashfreeUPIOrder({
      userId: req.user.id,
      planId,
      customerEmail: req.user.email
    });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'UPI order generation failed.' });
  }
});

/**
 * POST /api/payments/confirm-upi
 * Confirms payment and upgrades account to Pro
 */
router.post('/payments/confirm-upi', requireAuth, async (req, res) => {
  try {
    const { orderId, planId = 'pro', transactionRef } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required.' });
    }
    const result = await confirmUPIPayment({
      orderId,
      userId: req.user.id,
      planId,
      transactionRef
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Payment confirmation failed.' });
  }
});

/**
 * GET /api/user/payments
 * User payment receipts
 */
router.get('/user/payments', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve payment records.' });
  }
});

export default router;
