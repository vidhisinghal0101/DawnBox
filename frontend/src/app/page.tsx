'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useFeedStore } from '../store';
import { Sidebar } from '../components/Sidebar';
import { ItemCard } from '../components/ItemCard';
import { BriefingPanel } from '../components/BriefingPanel';
import { Loader2, RefreshCw, Layers, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, snoozedItems, briefing, loading, error, fetchStatus, analyzeStatus, fetchItems, fetchSnoozedItems, fetchBriefing, triggerFetch, triggerAnalyze } = useFeedStore();
  const [activeTab, setActiveTab] = React.useState<'All' | 'Action Required' | 'FYI' | 'Ignore' | 'Snoozed'>('All');

  const userId = (session?.user as unknown as { id: string })?.id || "1";

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchItems(userId);
      fetchSnoozedItems(userId);
      fetchBriefing(userId);
    }
  }, [status, userId, fetchItems, fetchSnoozedItems, fetchBriefing, router]);

  const handleFetch = () => {
    triggerFetch(userId);
  };

  const handleAnalyze = () => {
    triggerAnalyze(userId);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }


  const activeItems = items.filter(i => !i.is_resolved);
  const completedItems = items.filter(i => i.is_resolved);

  const getButtonState = (currentStatus: string, defaultText: string, defaultIcon: React.ReactNode, isPrimary: boolean = false) => {
    let label = defaultText;
    let icon = defaultIcon;
    let style = isPrimary ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-zinc-800 text-white hover:bg-zinc-700';

    if (currentStatus === 'running') {
      label = isPrimary ? 'Analyzing...' : 'Fetching...';
      icon = <Loader2 size={18} className="animate-spin" />;
    } else if (currentStatus === 'success') {
      label = 'Done!';
      icon = <CheckCircle2 size={18} />;
      style = 'bg-green-500 text-white hover:bg-green-600';
    } else if (currentStatus === 'error') {
      label = 'Failed';
      icon = <AlertCircle size={18} />;
      style = 'bg-red-500 text-white hover:bg-red-600';
    }

    return { label, icon, style };
  };

  const fetchBtn = getButtonState(fetchStatus, 'Fetch Notifications', <RefreshCw size={18} />);
  const analyzeBtn = getButtonState(analyzeStatus, 'Run AI Analysis', <Sparkles size={18} />, true);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-indigo-500/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 text-white">Inbox</h1>
              <p className="text-muted-foreground text-sm">Smart prioritization of your GitHub, Gmail and Slack notifications</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFetch}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 ${fetchBtn.style === 'bg-zinc-800 text-white hover:bg-zinc-700' ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200' : fetchBtn.style}`}
              >
                {fetchBtn.icon}
                <span>{fetchBtn.label}</span>
              </button>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 hover:shadow-indigo-500/25 ${analyzeBtn.style === 'bg-purple-600 text-white hover:bg-purple-700' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-400/30' : analyzeBtn.style}`}
              >
                {analyzeBtn.icon}
                <span>{analyzeBtn.label}</span>
              </button>
            </div>
          </header>

          {/* Error Toast */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state during pipeline run */}
          {loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                  <Loader2 size={28} className="animate-spin text-indigo-400" />
                </div>
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse blur-xl"></div>
              </div>
              <p className="text-zinc-300 font-medium mb-1">Working...</p>
              <p className="text-zinc-500 text-sm">This may take up to 30 seconds</p>
            </div>
          )}

          {!loading && <BriefingPanel briefing={briefing} />}

          {!loading && (
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={18} className="text-zinc-400" />
                      <h2 className="text-lg font-semibold text-zinc-200 tracking-tight">Priority Queue</h2>
                    </div>
                  </div>

                  {/* Interactive Filter Cards - Small Buttons */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button
                      onClick={() => setActiveTab('All')}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-300 flex items-center gap-2 ${activeTab === 'All'
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/30'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${activeTab === 'All' ? 'bg-indigo-400' : 'bg-indigo-500/50'}`}></div>
                      All ({activeItems.length})
                    </button>

                    <button
                      onClick={() => setActiveTab('Action Required')}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-300 flex items-center gap-2 ${activeTab === 'Action Required'
                        ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${activeTab === 'Action Required' ? 'bg-red-400' : 'bg-red-500/50'}`}></div>
                      Action Required ({activeItems.filter(i => i.priority_tag === 'Action Required').length})
                    </button>

                    <button
                      onClick={() => setActiveTab('FYI')}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-300 flex items-center gap-2 ${activeTab === 'FYI'
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-yellow-300 hover:bg-yellow-500/10 hover:border-yellow-500/30'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${activeTab === 'FYI' ? 'bg-yellow-400' : 'bg-yellow-500/50'}`}></div>
                      FYI ({activeItems.filter(i => i.priority_tag === 'FYI').length})
                    </button>

                    <button
                      onClick={() => setActiveTab('Ignore')}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-300 flex items-center gap-2 ${activeTab === 'Ignore'
                        ? 'bg-slate-700/50 border-slate-500 text-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.15)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${activeTab === 'Ignore' ? 'bg-slate-400' : 'bg-slate-600'}`}></div>
                      Ignore ({activeItems.filter(i => i.priority_tag === 'Can Ignore' || i.priority_tag === 'Uncategorized').length})
                    </button>

                    <button
                      onClick={() => setActiveTab('Snoozed')}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-300 flex items-center gap-2 ${activeTab === 'Snoozed'
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${activeTab === 'Snoozed' ? 'bg-purple-400' : 'bg-purple-600'}`}></div>
                      Snoozed ({snoozedItems.length})
                    </button>
                  </div>
                </div>


              </div>

              <div className="space-y-4">
                {(() => {
                  if (activeTab === 'Snoozed') {
                    if (snoozedItems.length === 0) {
                      return (
                        <div className="rounded-xl p-12 text-center flex flex-col items-center mt-6 border-2 border-dashed border-zinc-800/50 bg-zinc-900/20">
                          <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                            <Layers size={24} className="text-zinc-500" />
                          </div>
                          <h3 className="text-lg font-medium text-zinc-300 mb-1">No snoozed items</h3>
                          <p className="text-zinc-500 text-sm max-w-sm">
                            Notifications you snooze will appear here until they wake up.
                          </p>
                        </div>
                      );
                    }
                    return snoozedItems.map(item => <ItemCard key={item.id} item={item} />);
                  }

                  const filteredItems = activeItems.filter(item => {
                    if (activeTab === 'Action Required') return item.priority_tag === 'Action Required';
                    if (activeTab === 'FYI') return item.priority_tag === 'FYI';
                    if (activeTab === 'Ignore') return item.priority_tag === 'Can Ignore' || item.priority_tag === 'Uncategorized';
                    return true;
                  });

                  if (filteredItems.length === 0) {
                    return (
                      <div className="rounded-xl p-12 text-center flex flex-col items-center mt-6 border-2 border-dashed border-zinc-800/50 bg-zinc-900/20">
                        <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                          <CheckCircle2 size={24} className="text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-300 mb-1">Inbox zero! Time to relax 🏖️</h3>
                        <p className="text-zinc-500 text-sm max-w-sm">
                          You have no notifications in this category.
                        </p>
                      </div>
                    );
                  }

                  return filteredItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ));
                })()}
              </div>
            </div>
          )}

          {completedItems.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4 px-1 opacity-70">
                <CheckCircle2 size={18} className="text-green-500" />
                <h2 className="text-lg font-semibold text-zinc-300 tracking-tight">Completed Today</h2>
                <span className="text-xs font-medium bg-zinc-800 px-2 py-0.5 rounded-full ml-2 text-zinc-400">
                  {completedItems.length}
                </span>
              </div>
              <div className="space-y-4">
                {completedItems.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
