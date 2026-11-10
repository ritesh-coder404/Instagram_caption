import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase.js';
import CosmicDotsCanvas from '../../components/CosmicDotsCanvas.jsx';
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
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-blue-500 selection:text-white relative overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Demo Mode Notice */}
      {!isSupabaseConfigured && (
        <div className="bg-blue-950/40 border-b border-blue-500/20 text-blue-300 text-xs text-center py-2 px-4 relative z-50 backdrop-blur-md">
          ⚠️ <strong>Demo Mode</strong> — Supabase keys not set yet. UI is fully interactive.{' '}
          <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline hover:text-blue-200">
            Setup Supabase
          </a>{' '}
          to enable database features.
        </div>
      )}

      {/* Floating Horizontal Capsule / Circular Dock Navbar */}
      <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <header className="pointer-events-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-2.5 bg-neutral-950/85 backdrop-blur-2xl border border-white/15 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.8)] max-w-4xl w-full transition-all duration-300 hover:border-white/25">
          {/* Logo Pill Circle */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(96,165,250,0.3)] group-hover:scale-105 transition">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-semibold text-sm sm:text-base text-white tracking-tight">CaptionCraft</span>
          </Link>

          {/* Navigation Links inside circular pill */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-400">
            <a href="#problem" className="hover:text-white transition">The Problem</a>
            <a href="#demo" className="hover:text-white transition">Interactive Demo</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 sm:px-5 py-1.5 sm:py-2 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-full transition-all shadow-md active:scale-95"
            >
              Start Free
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section — Deep Space Google Antigravity Cosmic Aesthetics */}
      <section className="relative min-h-[90vh] flex items-center px-6 md:px-12 lg:px-20 overflow-hidden bg-black pt-28 md:pt-36">
        {/* Dynamic Interactive Celestial Particle Galaxy Canvas */}
        <CosmicDotsCanvas />

        {/* Ambient Cosmic Radial Glows */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[350px] bg-indigo-600/15 blur-[160px] rounded-full pointer-events-none" />

        {/* Hero Content — Clean Google Antigravity Typography & Pill Buttons */}
        <div className="max-w-3xl relative z-10 py-16 md:py-24 space-y-7">
          {/* Subtle Accent Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-neutral-300 text-xs font-medium backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>AI-Powered Suite for Instagram Reels Creators</span>
          </div>

          {/* Main Title with Iconic Antigravity Gradient Cursor */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal text-white tracking-tight leading-[1.08]">
            CaptionCraft for <br className="hidden sm:inline" />
            Creators
            <span className="inline-block w-1.5 h-8 sm:h-12 md:h-14 ml-2.5 align-middle bg-gradient-to-b from-blue-400 via-purple-400 to-amber-300 rounded-full animate-pulse shadow-[0_0_12px_rgba(96,165,250,0.85)]" />
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-400 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
            Drop your video topic or clip. Get ready-to-post viral hook lines, high-retention formatted captions, and curated 3-tier hashtags in English, Hindi, or Hinglish.
          </p>

          {/* Pill Action Buttons (Exact Google Antigravity Style) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/signup"
              className="px-6 py-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm rounded-full transition shadow-lg active:scale-95 flex items-center gap-2 group"
            >
              <span>Start Free for Reels</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>

            <a
              href="#demo"
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-neutral-200 border border-white/10 font-semibold text-xs sm:text-sm rounded-full backdrop-blur-md transition active:scale-95"
            >
              Interactive Demo
            </a>
          </div>

          {/* Micro Trust Indicators */}
          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> 300+ Curated Hashtags
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Hindi & Hinglish Ready
            </span>
          </div>
        </div>
      </section>

      {/* The Creator Bottleneck Section */}
      <section id="problem" className="py-24 bg-neutral-950/80 border-t border-neutral-900 px-6 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-normal text-white tracking-tight">The Creator Bottleneck</h2>
            <p className="text-neutral-400 text-xs md:text-sm max-w-md mx-auto">
              Why traditional manual reel research and caption writing drains your creative energy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="p-8 bg-neutral-900/40 border border-neutral-800 rounded-3xl space-y-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-neutral-400">
                <Clock className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-medium text-white">The Old 30-Minute Process</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-neutral-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span> Staring at a blank screen trying to formulate a captivating first-second hook.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span> Manually researching 20 hashtags on Instagram search to find non-crowded tags.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span> Generic ChatGPT outputs that sound like academic essays instead of human reels.
                </li>
              </ul>
            </div>

            {/* The CaptionCraft Way */}
            <div className="p-8 bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-blue-500/30 rounded-3xl space-y-4 shadow-xl backdrop-blur-sm">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white">The CaptionCraft Flow</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span> Ready-to-post first-second hook guaranteed to stop scrolling thumbs.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span> Verified 3-tier hashtag formula: High (5), Medium (8), and Niche (10).
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span> Native Hinglish and Hindi tones that genuinely connect with Indian audiences.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Simulator */}
      <section id="demo" className="py-24 px-6 max-w-4xl mx-auto w-full relative z-10">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-neutral-300 text-xs font-medium rounded-full">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">See What CaptionCraft Outputs</h2>
          <p className="text-neutral-400 text-xs sm:text-sm">A single click creates this complete ready-to-post reel package</p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-md">
          {/* Sample Input Bar */}
          <div className="p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800 flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="text-neutral-500 block uppercase font-bold text-[10px]">Sample Topic</span>
              <span className="font-medium text-white">{demoTopic}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-[10px] font-medium rounded-full uppercase border border-neutral-700/50">
                Motivational
              </span>
              <span className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-[10px] font-medium rounded-full border border-neutral-700/50">
                English
              </span>
            </div>
          </div>

          {/* Simulated Result Card */}
          <div className="space-y-4">
            <div className="p-4 bg-neutral-900/40 rounded-2xl border border-neutral-800/80">
              <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">1. Viral Hook</span>
              <p className="text-sm font-semibold text-white">{sampleDemo.hook}</p>
            </div>

            <div className="p-4 bg-neutral-900/40 rounded-2xl border border-neutral-800/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">2. Caption Body</span>
              <p className="text-xs sm:text-sm text-neutral-300 whitespace-pre-line leading-relaxed">{sampleDemo.caption}</p>
            </div>

            {/* 3-Tier Hashtags */}
            <div className="p-4 bg-neutral-900/40 rounded-2xl border border-neutral-800/80 space-y-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">3. Curated 3-Tier Hashtags</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleDemo.high.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-950/40 border border-blue-500/20 text-blue-300 text-xs rounded-full">
                    {t}
                  </span>
                ))}
                {sampleDemo.medium.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-xs rounded-full">
                    {t}
                  </span>
                ))}
                {sampleDemo.niche.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-purple-950/40 border border-purple-500/20 text-purple-300 text-xs rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCopyDemo}
                className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-full flex items-center gap-2 transition active:scale-95 shadow-md"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Sample Copied!' : 'Copy Complete Sample Post'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 bg-neutral-950/80 border-t border-neutral-900 px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">Simple, Creator-Friendly Pricing</h2>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto">
            Start for free. Upgrade to unlimited when you're ready to scale your posting schedule.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-6 max-w-2xl mx-auto">
            <div className="p-8 bg-neutral-900/40 border border-neutral-800 rounded-3xl space-y-4">
              <span className="text-xs uppercase font-medium text-neutral-400">Free Tier</span>
              <div className="text-3xl font-normal text-white">₹0 <span className="text-xs text-neutral-500">/ mo</span></div>
              <ul className="text-xs sm:text-sm text-neutral-300 space-y-2.5">
                <li>✓ 5 Generations per month</li>
                <li>✓ 3-Tier Hashtags</li>
                <li>✓ English, Hindi, Hinglish</li>
              </ul>
            </div>
            <div className="p-8 bg-gradient-to-b from-neutral-900 to-neutral-950 border border-blue-500/40 rounded-3xl space-y-4 shadow-xl">
              <span className="text-xs uppercase font-medium text-blue-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4" /> Pro Creator
              </span>
              <div className="text-3xl font-normal text-white">₹199 <span className="text-xs text-neutral-500">/ mo</span></div>
              <ul className="text-xs sm:text-sm text-neutral-300 space-y-2.5">
                <li>✓ Unlimited Reel Captions</li>
                <li>✓ AI Video & Audio Transcription</li>
                <li>✓ Curated 300+ Hashtag Library</li>
              </ul>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm rounded-full shadow-lg transition active:scale-95"
            >
              <span>Get Started in 30 Seconds</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 py-8 px-6 text-center text-xs text-neutral-500 bg-black relative z-10">
        <p>© 2026 CaptionCraft. Built for ambitious Instagram creators and agencies.</p>
      </footer>
    </div>
  );
}
