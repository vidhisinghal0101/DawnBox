/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import { useFeedStore } from '../../store';
import {
  User,
  Mail,
  Shield,
  ExternalLink,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

const INTEGRATIONS = [
  {
    id: 'gmail',
    name: 'Google / Gmail',
    description: 'Read and analyze your inbox',
    icon: <Mail size={18} className="text-red-400" />,
    iconBg: 'bg-red-500/10 border-red-500/20'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Notifications, PRs, and issues',
    icon: <FaGithub size={18} className="text-slate-200" />,
    iconBg: 'bg-white/10 border-white/20'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Unread messages and mentions',
    icon: <MessageSquare size={18} className="text-pink-400" />,
    iconBg: 'bg-pink-500/10 border-pink-500/20'
  }
] as const;

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { integrationStatus, fetchIntegrationStatus, connectIntegration, disconnectIntegration } = useFeedStore();

  const userId = (session?.user as unknown as { id: string })?.id || "1";

  useEffect(() => {
    if (status === 'authenticated') {
      fetchIntegrationStatus(userId);
    }
  }, [status, userId, fetchIntegrationStatus]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-indigo-500/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-1 text-white">Settings</h1>
            <p className="text-slate-400 text-sm">Manage your account and integrations</p>
          </header>

          {/* Profile Section */}
          <div className="glass-panel rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} className="text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-200">Profile</h2>
            </div>

            <div className="flex items-center gap-5">
              {user?.image ? (
                <img src={user.image} alt="Avatar" className="w-16 h-16 rounded-full ring-2 ring-white/10 shadow-xl" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold ring-2 ring-white/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <p className="text-white text-lg font-semibold tracking-tight">{user?.name || 'Developer'}</p>
                <p className="text-slate-400 text-sm">{user?.email || 'No email'}</p>
              </div>
            </div>
          </div>

          {/* Connected Accounts Section */}
          <div className="glass-panel rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={18} className="text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-200">Connected Accounts</h2>
            </div>

            <div className="space-y-4">
              {INTEGRATIONS.map((integration) => {
                const details = integrationStatus[integration.id as keyof typeof integrationStatus];
                const isConnected = details?.connected || false;
                
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg border ${integration.iconBg}`}>
                        {integration.icon}
                      </div>
                      <div>
                        <p className="text-slate-200 font-semibold text-sm">{integration.name}</p>
                        {isConnected && details?.name ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {details.image_url ? (
                              <img src={details.image_url} alt="" className="w-4 h-4 rounded-full ring-1 ring-white/10" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                                {details.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs text-indigo-400 font-medium">
                              Connected as {details.name}
                            </span>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs mt-0.5">{integration.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (isConnected) {
                            disconnectIntegration(userId, integration.id);
                          } else {
                            // Map 'gmail' integration ID to NextAuth's 'google' provider ID
                            const providerId = integration.id === 'gmail' ? 'google' : integration.id;
                            const options: Record<string, string> = {};
                            if (providerId === 'github') {
                              options.prompt = 'login';
                            } else if (providerId === 'google') {
                              options.prompt = 'select_account';
                            }
                            signIn(providerId, { callbackUrl: '/settings' }, options);
                          }
                        }}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 border ${
                          isConnected 
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' 
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20'
                        }`}
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* About Section */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink size={18} className="text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-200">About DawnBox</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              DawnBox is an AI-powered developer dashboard that uses Gemini to intelligently prioritize
              your GitHub notifications and Gmail messages. It helps you focus on what matters most.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span>Version 1.0.0</span>
              <span>•</span>
              <a href="https://github.com/vidhisinghal0101/DawnBox" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                GitHub Repository
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
