import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, Crown, ArrowLeft, ArrowRight } from 'lucide-react';

export default function Pricing() {
  const faqs = [
    {
      q: 'Why 3 tiers of hashtags instead of just 30 random tags?',
      a: 'Instagram ranking relies on categorization. High-reach tags place you in the macro topic, Medium tags connect you with targeted communities, and Niche tags give you early rank in low-competition searches.'
    },
    {
      q: 'Does video upload work with Reels and Shorts?',
      a: 'Yes! You can upload any MP4 or MOV video under 60 seconds (up to 50 MB). Our Gemini vision and audio engine extracts keyframes and spoken audio to write contextual captions.'
    },
    {
      q: 'What languages and tones are supported?',
      a: 'We support English, Hindi (Devnagari), and conversational Hinglish across 4 primary viral tones: Professional, Funny, Motivational, and Storytelling.'
    },
    {
      q: 'Can I cancel my Pro subscription at any time?',
      a: 'Yes, absolutely. No long-term contracts. You retain access until the end of your billing cycle.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-900 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 hover:text-white">Back to Home</span>
        </Link>
        <Link to="/signup" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl">
          Start Free
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20">
            Transparent Pricing
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white">Invest in Your Creator Velocity</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Save dozens of hours every month and stop guessing your caption strategy.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Starter */}
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Free Starter</span>
              <div className="text-3xl font-black text-white mt-2">
                ₹0 <span className="text-xs text-slate-500 font-normal">/ month</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Perfect for trying out the AI engine</p>

              <ul className="space-y-3 text-xs text-slate-300 mt-6">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5 Reel packages per month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3-Tier Hashtag Breakdown</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> English, Hindi, and Hinglish</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 5 Saved Hashtag Collections</li>
              </ul>
            </div>

            <Link
              to="/signup"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl text-center transition block"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Pro Creator */}
          <div className="p-8 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40 rounded-3xl flex flex-col justify-between space-y-6 shadow-2xl relative">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase rounded-full">
              Recommended
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4" /> Pro Creator
              </span>
              <div className="text-3xl font-black text-white mt-2">
                ₹199 <span className="text-xs text-slate-500 font-normal">/ month</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Unlimited power for serious creators</p>

              <ul className="space-y-3 text-xs text-slate-300 mt-6">
                <li className="flex items-center gap-2 font-bold text-white"><Check className="w-4 h-4 text-amber-400" /> Unlimited Reel Captions & Hooks</li>
                <li className="flex items-center gap-2 font-bold text-white"><Check className="w-4 h-4 text-amber-400" /> AI Video Clip & Audio Transcription</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Curated 300+ Hashtag Library</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Priority Gemini 2.5 Processing Speed</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400" /> Unlimited Saved Collections</li>
              </ul>
            </div>

            <Link
              to="/signup"
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs rounded-xl text-center shadow-lg transition block"
            >
              Get Started with Pro
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="pt-12 max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-white">{f.q}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
