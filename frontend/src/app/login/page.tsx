"use client";

import React from 'react';
import { signIn } from 'next-auth/react';
import { BrainCircuit, Mail, MessageSquare, Terminal } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/5 backdrop-blur-xl">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] mb-6">
              <BrainCircuit size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome to DawnBox</h1>
            <p className="text-zinc-400">Sign in to access your unified intelligence dashboard.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => signIn('github', { callbackUrl: '/' }, { prompt: 'select_account' })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-black hover:bg-zinc-200 transition-all font-semibold rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] group"
            >
              <FaGithub size={20} className="text-black group-hover:-translate-y-0.5 transition-transform" />
              <span>Continue with GitHub</span>
            </button>

            <button
              onClick={() => signIn('google', { callbackUrl: '/' }, { prompt: 'select_account' })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 transition-all font-semibold rounded-xl group"
            >
              <Mail size={20} className="text-white group-hover:-translate-y-0.5 transition-transform" />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => signIn('slack', { callbackUrl: '/' }, { prompt: 'select_account' })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#4A154B] text-white border border-white/10 hover:bg-[#3d113e] transition-all font-semibold rounded-xl group"
            >
              <MessageSquare size={20} className="text-white group-hover:-translate-y-0.5 transition-transform" />
              <span>Continue with Slack</span>
            </button>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => signIn('credentials', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all font-semibold rounded-xl group mt-4"
              >
                <Terminal size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                <span>Quick Mock Login</span>
              </button>
            )}
          </div>
          
          <div className="mt-6 text-center text-xs text-zinc-500">
            By continuing, you agree to allow DawnBox to securely sync and prioritize your professional notifications.
          </div>
        </div>
      </div>
    </div>
  );
}
