/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Settings,
  Mail,
  BrainCircuit,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useFeedStore } from '../store';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;
  const { integrationStatus, fetchIntegrationStatus } = useFeedStore();

  const userId = (session?.user as unknown as { id: string })?.id || "1";

  useEffect(() => {
    if (status === 'authenticated') {
      fetchIntegrationStatus(userId);
    }
  }, [status, userId, fetchIntegrationStatus]);

  return (
    <aside className="w-64 h-screen bg-slate-900/40 backdrop-blur-2xl fixed left-0 top-0 border-r border-white/5 flex flex-col p-4 z-10">
      <div className="flex items-center gap-3 mb-10 mt-2 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
          <BrainCircuit size={20} className="text-white" />
        </div>
        <h1 className="font-bold text-xl tracking-tight text-white drop-shadow-sm">DawnBox</h1>
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Main</p>
          <nav className="space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 ${pathname === '/' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/10'
                }`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          </nav>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Integrations</p>
          <nav className="space-y-1">
            <a
              href="https://github.com/vidhisinghal0101"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {integrationStatus.github.connected && integrationStatus.github.image_url ? (
                  <img src={integrationStatus.github.image_url} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10" />
                ) : (
                  <FaGithub size={18} />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium">GitHub</span>
                  {integrationStatus.github.connected && integrationStatus.github.name && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-medium leading-none mt-0.5">@{integrationStatus.github.name}</span>
                  )}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${integrationStatus.github.connected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-slate-600'}`}></div>
            </a>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {integrationStatus.gmail.connected && integrationStatus.gmail.image_url ? (
                  <img src={integrationStatus.gmail.image_url} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10" />
                ) : (
                  <Mail size={18} />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium">Gmail</span>
                  {integrationStatus.gmail.connected && integrationStatus.gmail.name && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-medium leading-none mt-0.5">{integrationStatus.gmail.name}</span>
                  )}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${integrationStatus.gmail.connected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-slate-600'}`}></div>
            </a>
            <a
              href="https://slack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {integrationStatus.slack.connected && integrationStatus.slack.image_url ? (
                  <img src={integrationStatus.slack.image_url} alt="" className="w-5 h-5 rounded-full ring-1 ring-white/10" />
                ) : (
                  <MessageSquare size={18} />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium">Slack</span>
                  {integrationStatus.slack.connected && integrationStatus.slack.name && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px] font-medium leading-none mt-0.5">{integrationStatus.slack.name}</span>
                  )}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${integrationStatus.slack.connected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-slate-600'}`}></div>
            </a>
          </nav>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="mb-4 px-3 py-3 rounded-xl bg-white/5 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} alt="" className="w-9 h-9 rounded-full ring-2 ring-white/10" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="truncate">
              <p className="text-sm text-slate-200 font-semibold truncate tracking-tight">{user.name || 'Developer'}</p>
              <p className="text-xs text-slate-500 truncate font-medium">{user.email || ''}</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-white/5">
        <nav className="space-y-1">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 ${pathname === '/settings' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/10'
              }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium border border-transparent hover:bg-red-500/10 text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all duration-300"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
