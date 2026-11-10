import React, { useState } from 'react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Wand2,
  Video,
  FileText,
  Copy,
  Check,
  RotateCw,
  BookmarkPlus,
  Loader2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  UploadCloud,
  FileCheck,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Generate() {
  const { user } = useAuth();
  const [mode, setMode] = useState('text'); // 'text' | 'video'
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('English');
  const [videoFile, setVideoFile] = useState(null);
  const [videoError, setVideoError] = useState('');

  // Execution states
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);

  // Result state
  const [result, setResult] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);
  const [saveSetName, setSaveSetName] = useState('');
  const [savingSet, setSavingSet] = useState(false);
  const [setSavedSuccess, setSetSavedSuccess] = useState(false);

  const tones = [
    { id: 'professional', label: 'Professional', emoji: '👔' },
    { id: 'funny', label: 'Funny & Sarcastic', emoji: '😂' },
    { id: 'motivational', label: 'Motivational', emoji: '🔥' },
    { id: 'storytelling', label: 'Storytelling', emoji: '📖' },
  ];

  const languages = ['English', 'Hindi', 'Hinglish'];

  // Handle Video Selection with Client Validation
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    setVideoError('');
    if (!file) return;

    // Validate type (mp4 or mov)
    const validTypes = ['video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov)$/i)) {
      setVideoError('Invalid file format. Only MP4 and MOV videos are permitted.');
      return;
    }

    // Validate file size (max 50 MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setVideoError('File size exceeds the 50 MB limit.');
      return;
    }

    // Validate video duration (max 60 seconds) using HTML5 Video object
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      if (videoElement.duration > 65) {
        setVideoError(`Video duration is ${Math.round(videoElement.duration)}s. Maximum allowed is 60 seconds.`);
        setVideoFile(null);
      } else {
        setVideoFile(file);
      }
    };
    videoElement.src = URL.createObjectURL(file);
  };

  const handleGenerate = async (overrideTone) => {
    const activeTone = overrideTone || tone;
    setError('');
    setLimitReached(false);
    setLoading(true);
    setResult(null);

    try {
      if (mode === 'text') {
        if (!topic.trim()) {
          setError('Please provide a topic, hook idea, or video summary.');
          setLoading(false);
          return;
        }

        setProgressMsg('Crafting high-impact hook and viral caption...');
        const res = await api.post('/generate', {
          topic: topic.trim(),
          tone: activeTone,
          language
        });

        if (res?.generation) {
          setResult(res.generation);
        }
      } else {
        // Video to Caption Pipeline
        if (!videoFile) {
          setError('Please select an MP4/MOV video under 60 seconds.');
          setLoading(false);
          return;
        }

        setProgressMsg('Uploading video to secure storage...');
        const fileExt = videoFile.name.split('.').pop();
        const storagePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(storagePath, videoFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        setProgressMsg('Analyzing frames and audio with Gemini Vision AI...');
        const jobRes = await api.post('/generate-from-video', {
          storagePath,
          videoUrl: storagePath,
          tone: activeTone,
          language
        });

        const jobId = jobRes.jobId;

        // Poll job every 3 seconds
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const jobStatus = await api.get(`/jobs/${jobId}`);
            if (jobStatus.status === 'done') {
              clearInterval(interval);
              setResult(jobStatus.result);
              setLoading(false);
            } else if (jobStatus.status === 'failed') {
              clearInterval(interval);
              setError(jobStatus.error || 'Video transcription and analysis failed.');
              setLoading(false);
            } else {
              setProgressMsg(`Processing video frames and transcription... (${attempts * 3}s)`);
            }
          } catch (pollErr) {
            console.warn('Poll error:', pollErr);
          }

          if (attempts > 30) {
            clearInterval(interval);
            setError('Processing timed out. Please try again.');
            setLoading(false);
          }
        }, 3000);

        return; // Handled by polling
      }
    } catch (err) {
      if (err.status === 402 || err.data?.code === 'LIMIT_REACHED') {
        setLimitReached(true);
      } else {
        setError(err.message || 'An error occurred during generation.');
      }
    } finally {
      if (mode === 'text') setLoading(false);
    }
  };

  const copyToClipboard = (text, sectionKey) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getJoinedTags = () => {
    if (!result?.hashtags) return '';
    const h = result.hashtags.high || [];
    const m = result.hashtags.medium || [];
    const n = result.hashtags.niche || [];
    return [...h, ...m, ...n].join(' ');
  };

  const handleSaveSet = async () => {
    if (!saveSetName.trim() || !result?.hashtags) return;
    setSavingSet(true);
    try {
      const allTags = [
        ...(result.hashtags.high || []),
        ...(result.hashtags.medium || []),
        ...(result.hashtags.niche || [])
      ];

      await api.post('/user/saved-sets', {
        name: saveSetName.trim(),
        hashtags: allTags
      });

      setSetSavedSuccess(true);
      setTimeout(() => setSetSavedSuccess(false), 3000);
      setSaveSetName('');
    } catch (err) {
      alert('Failed to save set: ' + err.message);
    } finally {
      setSavingSet(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Generate Caption & Hashtags</h1>
        <p className="text-slate-400 text-sm mt-1">
          Trained on high-retention Instagram reels. Get hooks, structured captions, and 3-tier hashtags.
        </p>
      </div>

      {/* Limit Reached Banner (HTTP 402) */}
      {limitReached && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-300">Monthly Generation Allowance Exhausted</h3>
            <p className="text-xs text-slate-300 mt-1">
              You have reached your 5 free generations for this month. Upgrade to Pro (Rs 199/month) for unlimited captions, video analysis, and priority AI processing.
            </p>
            <div className="mt-3">
              <Link
                to="/app/billing"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                <span>Upgrade to Pro Now</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Input Configuration Card */}
      <div className="p-6 md:p-8 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-6">
        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 w-fit">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              mode === 'text'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>From Topic / Idea</span>
          </button>
          <button
            onClick={() => setMode('video')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              mode === 'video'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>From Video (Reel / Clip)</span>
          </button>
        </div>

        {/* Input Details */}
        {mode === 'text' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Topic or Reel Concept
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 3 mistakes beginner gym goers make when trying to lose fat in 2026..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Upload Video Clip (Max 60s, 50MB, MP4 / MOV)
            </label>
            <div className="p-6 border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl text-center bg-slate-950/40 transition">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoChange}
                className="hidden"
                id="video-upload-input"
              />
              <label htmlFor="video-upload-input" className="cursor-pointer block">
                {videoFile ? (
                  <div className="flex items-center justify-center gap-3 text-emerald-400">
                    <FileCheck className="w-8 h-8" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{videoFile.name}</p>
                      <p className="text-xs text-slate-400">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-300">Click to select video from your device</p>
                    <p className="text-[11px] text-slate-500 mt-1">MP4 or MOV up to 60 seconds</p>
                  </div>
                )}
              </label>
            </div>
            {videoError && <p className="text-xs text-rose-400 mt-1 font-medium">{videoError}</p>}
          </div>
        )}

        {/* Tone & Language Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Tone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Content Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`p-3 rounded-xl text-left border text-xs font-semibold flex items-center gap-2 transition ${
                    tone === t.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Output Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                    language === lang
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={() => handleGenerate()}
          disabled={loading || limitReached}
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{progressMsg || 'Generating...'}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generate Reel Package</span>
            </>
          )}
        </button>
      </div>

      {/* Result Display Section */}
      {result && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Your Ready-To-Post Package</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
              <button
                onClick={() => {
                  const nextTone = tone === 'funny' ? 'motivational' : tone === 'motivational' ? 'storytelling' : 'funny';
                  setTone(nextTone);
                  handleGenerate(nextTone);
                }}
                disabled={loading}
                className="px-3.5 py-1.5 bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try Another Tone</span>
              </button>
            </div>
          </div>

          {/* 1. Viral Hook */}
          <div className="p-5 bg-slate-900 border border-purple-500/30 rounded-2xl relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                1. Viral First-Second Hook Line
              </span>
              <button
                onClick={() => copyToClipboard(result.hook, 'hook')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                {copiedSection === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'hook' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-base font-extrabold text-white leading-relaxed">{result.hook}</p>
          </div>

          {/* 2. Structured Caption */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                2. Caption Body & Call-To-Action
              </span>
              <button
                onClick={() => copyToClipboard(result.caption, 'caption')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                {copiedSection === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'caption' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{result.caption}</p>
          </div>

          {/* 3. Three-Tier Hashtag Groups */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                3. Curated 3-Tier Hashtags
              </span>
              <button
                onClick={() => copyToClipboard(getJoinedTags(), 'hashtags')}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition"
              >
                {copiedSection === 'hashtags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'hashtags' ? 'All Tags Copied!' : 'Copy All Hashtags'}</span>
              </button>
            </div>

            {/* High Reach Tier */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-emerald-400">High-reach (Broad Category)</span>
                <span className="text-[10px] text-slate-500">{(result.hashtags?.high || []).length} tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(result.hashtags?.high || []).map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Medium Tier */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-sky-400">Medium (Community & Sub-niche)</span>
                <span className="text-[10px] text-slate-500">{(result.hashtags?.medium || []).length} tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(result.hashtags?.medium || []).map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-sky-950/40 border border-sky-500/20 text-sky-300 rounded-lg text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Niche Tier */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-purple-400">Niche (Low Competition & Specific)</span>
                <span className="text-[10px] text-slate-500">{(result.hashtags?.niche || []).length} tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(result.hashtags?.niche || []).map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-purple-950/40 border border-purple-500/20 text-purple-300 rounded-lg text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Master Copy & Save Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                const fullText = `${result.hook}\n\n${result.caption}\n\n${getJoinedTags()}`;
                copyToClipboard(fullText, 'all');
              }}
              className="w-full md:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition"
            >
              {copiedSection === 'all' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Everything Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Complete Post (Hook + Caption + Tags)</span>
                </>
              )}
            </button>

            {/* Save as Set */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Name this hashtag set..."
                value={saveSetName}
                onChange={(e) => setSaveSetName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 flex-1 md:w-48"
              />
              <button
                onClick={handleSaveSet}
                disabled={savingSet || !saveSetName.trim()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition flex-shrink-0"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>{setSavedSuccess ? 'Saved!' : 'Save Set'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
