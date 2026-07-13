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
  const { items, briefing, loading, error, fetchStatus, analyzeStatus, fetchItems, fetchBriefing, triggerFetch, triggerAnalyze } = useFeedStore();
  const [showAll, setShowAll] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'All' | 'Action Required' | 'FYI' | 'Ignore'>('All');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const userId = (session?.user as unknown as { id: string })?.id || "1";

  useEffect(() => {
    if (status === 'authenticated') {
      fetchItems(userId);
      fetchBriefing(userId);
    }
  }, [status, userId, fetchItems, fetchBriefing]);

  const handleFetch = () => {
    triggerFetch(userId);
  };

  const handleAnalyze = () => {
    triggerAnalyze(userId);
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-500" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-purple-500/30">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 text-white">Developer Inbox</h1>
              <p className="text-muted-foreground text-sm">Smart prioritization of your GitHub and email notifications</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleFetch}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${fetchBtn.style}`}
              >
                {fetchBtn.icon}
                <span>{fetchBtn.label}</span>
              </button>
              
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(147,51,234,0.3)] ${analyzeBtn.style}`}
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
                <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-purple-500" />
                </div>
                <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-pulse"></div>
              </div>
              <p className="text-zinc-300 font-medium mb-1">Working...</p>
              <p className="text-zinc-500 text-sm">This may take up to 30 seconds</p>
            </div>
          )}

          {!loading && <BriefingPanel briefing={briefing} />}

          {!loading && items.length > 0 && (
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
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        activeTab === 'All'
                          ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      Show All Categories
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('Action Required')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                        activeTab === 'Action Required'
                          ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-red-400/80 hover:bg-red-500/10 hover:border-red-500/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'Action Required' ? 'bg-red-400' : 'bg-red-500/50'}`}></div>
                      Action Required ({items.filter(i => i.priority_tag === 'Action Required').length})
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('FYI')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                        activeTab === 'FYI'
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-yellow-400/80 hover:bg-yellow-500/10 hover:border-yellow-500/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'FYI' ? 'bg-yellow-400' : 'bg-yellow-500/50'}`}></div>
                      FYI ({items.filter(i => i.priority_tag === 'FYI').length})
                    </button>

                    <button
                      onClick={() => setActiveTab('Ignore')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 ${
                        activeTab === 'Ignore'
                          ? 'bg-zinc-700/50 border-zinc-500 text-zinc-300 shadow-[0_0_10px_rgba(161,161,170,0.2)]'
                          : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'Ignore' ? 'bg-zinc-400' : 'bg-zinc-600'}`}></div>
                      Ignore ({items.filter(i => i.priority_tag === 'Can Ignore' || i.priority_tag === 'Uncategorized').length})
                    </button>
                  </div>
                </div>

                {activeTab === 'All' && (
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-800"
                  >
                    {showAll ? "Hide low priority" : "Show all notifications"}
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                      {items.length}
                    </span>
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {(() => {
                  const filteredItems = items.filter(item => {
                    if (activeTab === 'Action Required') return item.priority_tag === 'Action Required';
                    if (activeTab === 'FYI') return item.priority_tag === 'FYI';
                    if (activeTab === 'Ignore') return item.priority_tag === 'Can Ignore' || item.priority_tag === 'Uncategorized';
                    return showAll || item.priority_tag !== 'Can Ignore';
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

          {!loading && items.length === 0 && (
            <div className="glass-panel rounded-xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                <Layers size={24} className="text-zinc-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Notifications</h3>
              <p className="text-muted-foreground max-w-sm">
                Your queue is empty. Click Fetch Notifications to get your latest updates.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
