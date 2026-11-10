import { supabaseAdmin } from '../config/supabase.js';
import { cleanHashtags } from './gemini.js';

/**
 * Enhanced Hashtag Engine:
 * - Pulls verified active hashtags from the DB library
 * - Merges with LLM's dynamic niche tags
 * - Eliminates duplicates across all tiers
 * - Guarantees High (up to 5), Medium (up to 8), Niche (up to 10)
 */
export async function getEnhancedHashtags({ niche, topic, llmHashtags = {} }) {
  let dbTagsByTier = { high: [], medium: [], niche: [] };

  try {
    // 1. Fetch matching active hashtags from Supabase library
    const { data: dbTags, error } = await supabaseAdmin
      .from('hashtags')
      .select('tag, size, niche')
      .eq('is_active', true)
      .ilike('niche', `%${niche || 'general'}%`);

    if (!error && Array.isArray(dbTags) && dbTags.length > 0) {
      dbTags.forEach(item => {
        if (dbTagsByTier[item.size]) {
          dbTagsByTier[item.size].push(item.tag);
        }
      });
    }
  } catch (err) {
    console.warn('DB hashtag fetch warning, relying on LLM tags:', err.message);
  }

  // 2. Global deduplication tracker
  const globalSeen = new Set();

  function selectUnique(primaryList, fallbackList, limit) {
    const result = [];
    const combined = [...(primaryList || []), ...(fallbackList || [])];
    const cleaned = cleanHashtags(combined);

    for (const tag of cleaned) {
      const lower = tag.toLowerCase();
      if (!globalSeen.has(lower)) {
        globalSeen.add(lower);
        result.push(tag);
        if (result.length >= limit) break;
      }
    }
    return result;
  }

  // Fill tiers adhering strictly to requirements: High (5), Medium (8), Niche (10)
  const high = selectUnique(dbTagsByTier.high, llmHashtags.high, 5);
  const medium = selectUnique(dbTagsByTier.medium, llmHashtags.medium, 8);
  const nicheTags = selectUnique(dbTagsByTier.niche, llmHashtags.niche, 10);

  return {
    high,
    medium,
    niche: nicheTags
  };
}
