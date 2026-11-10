import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase.js';
import {
  Sparkles,
  Wand2,
  Video,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  TrendingUp,
  Instagram,
  Copy,
  Check,
  Crown
} from 'lucide-react';

export default function Landing() {
  const [demoTopic, setDemoTopic] = useState('3 fitness mistakes that ruin fat loss');
  const [copied, setCopied] = useState(false);

  const sampleDemo = {
    hook: "Stop doing cardio for 2 hours! 🛑 Here is why your fat loss is stalling:",
    caption: "Most creators think more sweat = more results. But here's what the science actually says:\n\n1. Nutrition accounts for 80% of fat loss.\n2. Heavy lifting preserves your metabolism.\n3. Sleep deprivation spikes cortisol and cravings.\n\n👇 Save this reel and drop your current workout split in the comments!",
    high: ['#fitness', '#workout', '#gymlife', '#fitfam', '#bodybuilding'],
    medium: ['#fatlosstips', '#fitnessmotivation', '#homeworkout', '#fitspo'],
    niche: ['#caloriedeficitindia', '#fatlossjourney', '#sustainablefitness', '#desifit']
  };

  const handleCopyDemo = () => {
    const text = `${sampleDemo.hook}\n\n${sampleDemo.caption}\n\n${[...sampleDemo.high, ...sampleDemo.medium, ...sampleDemo.niche].join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Demo Mode Banner */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs text-center py-2 px-4">
          ⚠️ <strong>Demo Mode</strong> — Supabase keys nahi hain. Sirf UI dekh sakte ho.{' '}
          <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline hover:text-amber-200">
            Supabase setup karo
          </a>{' '}
          to enable full features.
        </div>
      )}
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">CaptionCraft</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#problem" className="hover:text-white transition">The Problem</a>
            <a href="#demo" className="hover:text-white transition">Interactive Demo</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden text-center px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-pink-600/20 to-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Built specifically for Instagram Reels Creators</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Stop Spending 30 Minutes on <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Captions & Hashtags
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Drop your video topic or clip. Get a ready-to-post viral hook line, high-retention formatted caption, and curated 3-tier hashtags in English, Hindi, or Hinglish.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate 5 Free Reels</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm rounded-2xl transition"
            >
              See Live Sample
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 pt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 300+ Curated Hashtags
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hindi & Hinglish Ready
            </span>
          </div>
        </div>
      </section>

      {/* The Problem vs CaptionCraft */}
      <section id="problem" className="py-16 bg-slate-900/40 border-y border-slate-900 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">The Creator Bottleneck</h2>
            <p className="text-slate-400 text-xs">Why traditional reel posting burns you out</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-slate-950 border border-rose-500/20 rounded-3xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">The Old 30-Minute Process</h3>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span> Staring at a blank screen trying to formulate a captivating first-second hook.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span> Manually researching 20 hashtags on Instagram search to find non-crowded ones.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span> Generic ChatGPT outputs that sound like academic essays instead of human reels.
                </li>
              </ul>
            </div>

            <div className="p-8 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-3xl space-y-4 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">The CaptionCraft Flow</h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Ready-to-post first-second hook guaranteed to stop scrolling thumbs.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Verified 3-tier hashtag formula: High (5), Medium (8), and Niche (10).
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Native Hinglish and Hindi tones that genuinely connect with Indian audiences.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Simulator */}
      <section id="demo" className="py-20 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl font-black text-white">See What CaptionCraft Outputs</h2>
          <p className="text-slate-400 text-xs">A single click creates this complete ready-to-post reel package</p>
        </div>

        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          {/* Sample Input Bar */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Sample Topic</span>
              <span className="font-semibold text-white">{demoTopic}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-purple-950/60 text-purple-300 text-[10px] font-bold rounded-md uppercase">
                Motivational
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md">
                English
              </span>
            </div>
          </div>

          {/* Simulated Result Card */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">1. Viral Hook</span>
              <p className="text-sm font-extrabold text-white">{sampleDemo.hook}</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">2. Caption Body</span>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{sampleDemo.caption}</p>
            </div>

            {/* 3-Tier Hashtags */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Curated 3-Tier Hashtags</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleDemo.high.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs rounded-md">
                    {t}
                  </span>
                ))}
                {sampleDemo.medium.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-sky-950/40 border border-sky-500/20 text-sky-300 text-xs rounded-md">
                    {t}
                  </span>
                ))}
                {sampleDemo.niche.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-950/40 border border-purple-500/20 text-purple-300 text-xs rounded-md">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCopyDemo}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Sample Copied!' : 'Copy Complete Sample Post'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 bg-slate-900/30 border-t border-slate-900 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-black text-white">Simple, Creator-Friendly Pricing</h2>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Start for free. Upgrade to unlimited when you're ready to scale your posting schedule.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4 max-w-2xl mx-auto">
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
              <span className="text-xs uppercase font-bold text-slate-400">Free Tier</span>
              <div className="text-2xl font-black text-white">₹0 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>✓ 5 Generations per month</li>
                <li>✓ 3-Tier Hashtags</li>
                <li>✓ English, Hindi, Hinglish</li>
              </ul>
            </div>
            <div className="p-6 bg-gradient-to-b from-purple-950/60 to-slate-950 border border-purple-500/40 rounded-3xl space-y-4">
              <span className="text-xs uppercase font-bold text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Pro Creator
              </span>
              <div className="text-2xl font-black text-white">₹199 <span className="text-xs text-slate-500 font-normal">/ mo</span></div>
              <ul className="text-xs text-slate-300 space-y-2">
                <li>✓ Unlimited Reel Captions</li>
                <li>✓ AI Video & Audio Transcription</li>
                <li>✓ Curated 300+ Hashtag Library</li>
              </ul>
            </div>
          </div>

          <div className="pt-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-lg transition"
            >
              <span>Get Started in 30 Seconds</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-600">
        <p>© 2026 CaptionCraft. Built for ambitious Instagram creators and agencies.</p>
      </footer>
    </div>
  );
}
