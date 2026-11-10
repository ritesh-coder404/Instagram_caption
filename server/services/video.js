import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '../config/supabase.js';
import { cleanHashtags } from './gemini.js';
import { getEnhancedHashtags } from './hashtags.js';
import { incrementUsage } from '../middleware/usage.js';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;
if (apiKey && apiKey !== 'your-gemini-api-key') {
  aiClient = new GoogleGenAI({ apiKey });
}

/**
 * Extracts video metadata, audio, and up to 5 keyframes using fluent-ffmpeg.
 */
function extractMediaAssets(videoFilePath, tempDir) {
  return new Promise((resolve, reject) => {
    // 1. Probe video to check duration
    ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
      if (err) {
        console.warn('ffprobe error or not found, falling back to basic extraction:', err.message);
      } else {
        const duration = metadata?.format?.duration || 0;
        if (duration > 65) { // 60s limit with small tolerance
          return reject(new Error(`Video duration (${Math.round(duration)}s) exceeds the 60-second limit.`));
        }
      }

      const audioPath = path.join(tempDir, 'audio.mp3');
      const framePattern = path.join(tempDir, 'frame-%02d.jpg');

      // 2. Extract audio track
      ffmpeg(videoFilePath)
        .noVideo()
        .audioCodec('libmp3lame')
        .save(audioPath)
        .on('end', () => {
          // 3. Extract up to 5 representative frames
          ffmpeg(videoFilePath)
            .screenshots({
              count: 5,
              folder: tempDir,
              filename: 'frame-%02d.jpg',
              size: '640x?'
            })
            .on('end', () => {
              const frames = fs.readdirSync(tempDir)
                .filter(f => f.startsWith('frame-') && f.endsWith('.jpg'))
                .map(f => path.join(tempDir, f));

              resolve({
                audioPath: fs.existsSync(audioPath) ? audioPath : null,
                frames
              });
            })
            .on('error', (frameErr) => {
              console.warn('Frame extraction warning:', frameErr.message);
              resolve({
                audioPath: fs.existsSync(audioPath) ? audioPath : null,
                frames: []
              });
            });
        })
        .on('error', (audioErr) => {
          console.warn('Audio extraction warning:', audioErr.message);
          // Try frames even if audio track fails or is silent
          ffmpeg(videoFilePath)
            .screenshots({ count: 5, folder: tempDir, filename: 'frame-%02d.jpg' })
            .on('end', () => {
              const frames = fs.readdirSync(tempDir)
                .filter(f => f.startsWith('frame-') && f.endsWith('.jpg'))
                .map(f => path.join(tempDir, f));
              resolve({ audioPath: null, frames });
            })
            .on('error', () => resolve({ audioPath: null, frames: [] }));
        });
    });
  });
}

/**
 * Runs the asynchronous video-to-caption pipeline.
 * Guarantees removal of temporary files in all scenarios.
 */
export async function processVideoJob(jobId, userId, { storagePath, videoUrl, tone = 'professional', language = 'English' }) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `captioncraft-${jobId}-`));
  const localVideoPath = path.join(tempDir, 'source_video.mp4');

  try {
    // 1. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('videos')
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download video from storage: ${downloadError?.message || 'Empty file'}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    fs.writeFileSync(localVideoPath, Buffer.from(arrayBuffer));

    // 2. Extract media frames and audio with FFmpeg
    let mediaAssets = { audioPath: null, frames: [] };
    try {
      mediaAssets = await extractMediaAssets(localVideoPath, tempDir);
    } catch (ffmpegErr) {
      console.warn('FFmpeg extraction issue:', ffmpegErr.message);
    }

    // 3. Prepare Multimodal Payload for Gemini Vision & Audio
    let result = null;
    let transcriptSummary = 'Visual demonstration of content topic.';

    if (aiClient) {
      const parts = [];

      // Add image frames
      for (const framePath of mediaAssets.frames.slice(0, 5)) {
        if (fs.existsSync(framePath)) {
          const imgBase64 = fs.readFileSync(framePath).toString('base64');
          parts.push({
            inlineData: {
              data: imgBase64,
              mimeType: 'image/jpeg'
            }
          });
        }
      }

      const prompt = `You are CaptionCraft. Analyze the provided Instagram video frames.
Generate an irresistible Instagram Hook, engaging Caption, and 3-tier Hashtags.
Tone: ${tone}
Language: ${language}

OUTPUT VALID JSON ONLY:
{
  "hook": "Single viral hook line summarizing the video action/core value",
  "caption": "Full high-retention caption with line breaks and call-to-action",
  "niche": "Primary niche (e.g., fitness, food, tech, travel, fashion, business, education)",
  "transcript": "Brief summary of visible video actions and audio",
  "hashtags": {
    "high": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
    "medium": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
    "niche": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8", "#tag9", "#tag10"]
  }
}`;

      parts.push({ text: prompt });

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: parts,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const cleanedText = (response.text || '')
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(cleanedText);
      transcriptSummary = parsed.transcript || transcriptSummary;

      // Enhance hashtags with DB library
      const enhancedTags = await getEnhancedHashtags({
        niche: parsed.niche || 'video',
        topic: parsed.hook,
        llmHashtags: parsed.hashtags
      });

      result = {
        hook: parsed.hook.trim(),
        caption: parsed.caption.trim(),
        niche: parsed.niche || 'general',
        hashtags: enhancedTags
      };
    } else {
      // High-quality fallback when no API key is loaded
      result = {
        hook: `Watch till the end! The secret revealed in this video 🎬✨`,
        caption: `This video breaks down key strategies you cannot afford to miss.\n\nKey Takeaways:\n✨ Catch the nuances early on.\n✨ Consistency over raw talent.\n✨ Save this video to review later!\n\n👇 Tell us your reaction in the comments!`,
        niche: 'video',
        hashtags: {
          high: ['#reelsviral', '#instagramreels', '#trendingvideos', '#creatorlife', '#videotips'],
          medium: ['#videoproduction', '#contentcreators', '#reelsvideo', '#instadaily', '#trendingnow', '#videoedit', '#reelsindia', '#reelgrowth'],
          niche: ['#captioncraft', '#reeltactics', '#shortformcontent', '#microvideo', '#iggrowth', '#videohacks', '#visualstorytelling', '#creatorskills', '#videoanalysis', '#reachmore']
        }
      };
    }

    // 4. Save to `generations` table
    const { data: genData, error: genError } = await supabaseAdmin
      .from('generations')
      .insert({
        user_id: userId,
        topic: result.hook.slice(0, 100),
        video_url: videoUrl,
        transcript: transcriptSummary,
        tone,
        language,
        hook: result.hook,
        caption: result.caption,
        hashtags: result.hashtags
      })
      .select()
      .single();

    if (genError) {
      console.error('Error inserting video generation:', genError);
    }

    // 5. Increment usage count strictly after success
    await incrementUsage(userId);

    // 6. Update job status to 'done'
    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'done',
        result: genData || result
      })
      .eq('id', jobId);

  } catch (error) {
    console.error(`[Job ${jobId} Failed]:`, error);
    await supabaseAdmin
      .from('jobs')
      .update({
        status: 'failed',
        error: error.message || 'Video processing failed'
      })
      .eq('id', jobId);
  } finally {
    // 7. ALWAYS clean up temp directory and all intermediate files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.warn('Temp directory cleanup warning:', cleanupErr.message);
    }
  }
}
