import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;

if (apiKey && apiKey !== 'your-gemini-api-key') {
  aiClient = new GoogleGenAI({ apiKey });
} else {
  console.warn('⚠️ GEMINI_API_KEY is not configured. Falling back to mock generator for local testing.');
}

/**
 * Validates and cleans hashtag lists according to strict rules:
 * - Must start with '#'
 * - No internal spaces or special characters
 * - Deduplicated
 */
export function cleanHashtags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const cleaned = [];

  for (const raw of tags) {
    if (!raw || typeof raw !== 'string') continue;
    // Remove whitespace, commas, extra symbols
    let tag = raw.trim().replace(/\s+/g, '');
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }
    // Remove illegal characters from hashtag
    tag = tag.replace(/[^#\w\d_]/gi, '');
    const lower = tag.toLowerCase();

    if (lower.length > 1 && !seen.has(lower)) {
      seen.add(lower);
      cleaned.push(tag);
    }
  }
  return cleaned;
}

/**
 * Generates an Instagram Hook, Caption, and 3 tiers of Hashtags from text input
 */
export async function generateCaptionFromText({ topic, tone = 'professional', language = 'English' }) {
  if (!aiClient) {
    return generateMockCaption({ topic, tone, language });
  }

  const systemPrompt = `You are CaptionCraft, an elite Instagram social media strategist and viral copywriter.
Generate high-converting, viral Instagram content based on the user's topic, tone, and language.

LANGUAGE RULES:
- If language is 'Hindi', write in Devnagari Hindi or natural Hindi.
- If language is 'Hinglish', write in conversational Roman Hindi/English as used by Indian creators.
- If language is 'English', write in crisp, modern English.

OUTPUT SPECIFICATION:
You MUST return ONLY valid JSON matching this exact structure:
{
  "hook": "Single viral hook line (curiosity gap, pattern interrupt, or bold statement)",
  "caption": "Full formatted caption with line breaks, value delivery, and a clear call-to-action (CTA)",
  "niche": "Primary niche classification (e.g., fitness, tech, food, travel, fashion, business, comedy, education, lifestyle)",
  "hashtags": {
    "high": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
    "medium": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
    "niche": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8", "#tag9", "#tag10"]
  }
}
DO NOT output markdown ticks like \`\`\`json. Output ONLY the raw JSON object.`;

  const userPrompt = `Topic: "${topic}"
Tone: ${tone}
Language: ${language}

Generate the hook, caption, and hashtags now.`;

  // Attempt generation with retry on invalid JSON
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const promptToUse = attempt === 1 
        ? userPrompt 
        : `${userPrompt}\n\nIMPORTANT: Your previous attempt failed JSON parsing. Return STRICT JSON ONLY without code blocks or conversational text.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\n${promptToUse}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const responseText = response.text?.trim() || '';
      
      // Clean potential markdown ticks if present
      const cleanedJsonText = responseText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(cleanedJsonText);

      // Validate structure
      if (!parsed.hook || !parsed.caption || !parsed.hashtags) {
        throw new Error('Missing required fields in LLM response');
      }

      // Deduplicate and validate hashtags
      const high = cleanHashtags(parsed.hashtags.high || []).slice(0, 5);
      const medium = cleanHashtags(parsed.hashtags.medium || []).slice(0, 8);
      const niche = cleanHashtags(parsed.hashtags.niche || []).slice(0, 10);

      return {
        hook: parsed.hook.trim(),
        caption: parsed.caption.trim(),
        niche: parsed.niche?.toLowerCase().trim() || 'general',
        hashtags: { high, medium, niche }
      };
    } catch (err) {
      console.warn(`[Gemini Generation Attempt ${attempt} failed]:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`AI generation failed after 2 attempts: ${lastError?.message}`);
}

/**
 * High-quality mock fallback for development without an active Gemini key
 */
function generateMockCaption({ topic, tone, language }) {
  const isHindi = language.toLowerCase().includes('hindi');
  const isHinglish = language.toLowerCase().includes('hinglish');

  let hook = `Stop scrolling! Here is the truth about ${topic} 🚀`;
  let caption = `If you've been trying to figure out ${topic}, you're not alone.\n\nHere are 3 game-changing insights:\n1. Consistency beats intensity every single time.\n2. Master the fundamentals before chasing hacks.\n3. Save this post so you don't lose it.\n\n👇 Drop your thoughts in the comments below! What's your biggest hurdle with ${topic}?`;

  if (isHinglish) {
    hook = `Agar aap ${topic} seekhna chahte ho, toh yeh galti bilkul mat karna! 🛑`;
    caption = `Sach bataun toh ${topic} utna mushkil nahi hai jitna lagta hai.\n\nBas yeh 3 cheezein dhyan mein rakho:\n1. Daily thoda practice karo, perfection ke piche mat bhago.\n2. Basics clear rakho, short-cuts kaam nahi aate.\n3. Yeh reel save kar lo future reference ke liye.\n\n👇 Comment mein batao aapko kaunsa step sabse accha laga!`;
  } else if (isHindi) {
    hook = `क्या आप जानते हैं ${topic} के बारे में यह चौंकाने वाला सच? ⚡`;
    caption = `${topic} को समझने के लिए सबसे पहले बुनियादी बातों पर ध्यान दें।\n\n3 महत्वपूर्ण बातें:\n१. निरंतरता ही सफलता की कुंजी है।\n२. सही दिशा में अभ्यास करें।\n३. इस पोस्ट को सेव करें और अपने दोस्तों के साथ साझा करें।\n\n👇 अपनी राय कमेंट्स में जरूर साझा करें!`;
  }

  // Auto-generate tags based on topic words
  const cleanWord = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    hook,
    caption,
    niche: 'business',
    hashtags: {
      high: ['#instagramcreators', '#viralcontent', '#contentcreation', '#trendingreels', '#growthtips'],
      medium: cleanHashtags([`#${cleanWord}tips`, `#learn${cleanWord}`, `#${cleanWord}life`, `#creatorcommunity`, `#reeltrending`, `#digitalcreator`, `#instatips`, `#contentstrategy`]),
      niche: cleanHashtags([`#${cleanWord}mastery`, `#${cleanWord}hacks`, `#${cleanWord}guide`, `#microcreator`, `#daily${cleanWord}`, `#${cleanWord}india`, `#indiancreators`, `#reelsgrowth`, `#captioncraft`, `#explorepage`])
    }
  };
}
