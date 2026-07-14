import React, { useState } from 'react';
import { Mail, AlertTriangle, Info, ExternalLink, CheckCircle2, Check, Clock } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { formatDistanceToNow, format } from 'date-fns';
import { FeedItem, useFeedStore } from '../store';

export function ItemCard({ item }: { item: FeedItem }) {
  const isGithub = item.tool_name === 'github';
  const resolveItem = useFeedStore(state => state.resolveItem);
  const snoozeItem = useFeedStore(state => state.snoozeItem);
  const unsnoozeItem = useFeedStore(state => state.unsnoozeItem);
  const [showSnooze, setShowSnooze] = useState(false);
  
  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'Action Required':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'FYI':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'Can Ignore':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300';
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Action Required':
        return <AlertTriangle size={14} className="mr-1.5" />;
      case 'FYI':
        return <Info size={14} className="mr-1.5" />;
      case 'Can Ignore':
        return <CheckCircle2 size={14} className="mr-1.5" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'score-high';
    if (score >= 5) return 'score-medium';
    return 'score-low';
  };

  const handleClick = () => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handleResolve = (e: React.MouseEvent) => {
    e.stopPropagation();
    resolveItem(item.id);
  };

  const handleSnoozeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSnooze(!showSnooze);
  };

  const handleUnsnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    unsnoozeItem(item.id);
  };

  const handleSnooze = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    const date = new Date();
    if (option === 'today') {
      date.setHours(date.getHours() + 4);
    } else if (option === 'tomorrow') {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    } else if (option === 'next_week') {
      const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
      date.setDate(date.getDate() + daysUntilMonday);
      date.setHours(9, 0, 0, 0);
    }
    snoozeItem(item.id, date.toISOString());
    setShowSnooze(false);
  };

  return (
    <div 
      onClick={handleClick}
      className={`glass-panel p-5 rounded-2xl transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer border-l-4 ${
        item.is_resolved ? 'border-green-500/20 opacity-75' : 'border-l-indigo-500/50 hover:border-l-indigo-400'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center min-w-[50px]">
            <div className={`p-2 rounded-lg mb-1.5 ${isGithub ? 'bg-zinc-800 text-white' : 'bg-red-500/10 text-red-500'}`}>
              {isGithub ? <FaGithub size={20} /> : <Mail size={20} />}
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {isGithub ? 'GitHub' : 'Gmail'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-100 group-hover:text-indigo-300 transition-colors flex items-start gap-2 max-w-[550px] drop-shadow-sm">
              {item.title}
              <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
              <span>{item.author}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${getScoreColor(item.priority_score)} bg-black/40`}>
              Score: {item.priority_score}/10
            </span>
            {item.snoozed_until ? (
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                  Wakes up at {format(new Date(item.snoozed_until), "MMM d, h:mm a")}
                </span>
                <button 
                  onClick={handleUnsnooze}
                  className="text-xs flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition-all border border-white/10 hover:border-indigo-500/30 mt-1"
                >
                  <Clock size={14} className="text-indigo-400" />
                  Unsnooze
                </button>
              </div>
            ) : !item.is_resolved ? (
              <div className="flex items-center gap-2 relative">
                <button 
                  onClick={handleResolve}
                  className="text-xs flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-green-500/20 text-slate-300 hover:text-green-400 transition-all border border-white/10 hover:border-green-500/30"
                >
                  <Check size={14} />
                  Mark as Done
                </button>
                <button 
                  onClick={handleSnoozeToggle}
                  className="text-xs flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-slate-300 hover:text-yellow-400 transition-all border border-white/10 hover:border-yellow-500/30"
                >
                  <Clock size={14} />
                  Snooze
                </button>

                {/* Snooze Dropdown */}
                {showSnooze && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-10 py-1 overflow-hidden backdrop-blur-xl">
                    <button 
                      onClick={(e) => handleSnooze(e, 'today')}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Later Today (In 4 hrs)
                    </button>
                    <button 
                      onClick={(e) => handleSnooze(e, 'tomorrow')}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Tomorrow Morning (9 AM)
                    </button>
                    <button 
                      onClick={(e) => handleSnooze(e, 'next_week')}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Next Week (Mon 9 AM)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <CheckCircle2 size={14} />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-slate-300 text-sm mb-4 line-clamp-2 leading-relaxed">
        {item.content}
      </p>
      
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <span className={`flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg ${getTagStyle(item.priority_tag)}`}>
          {getTagIcon(item.priority_tag)}
          {item.priority_tag}
        </span>
        <p className="text-xs text-slate-400 italic flex-1 leading-relaxed border-l border-white/10 pl-3">
          <span className="text-indigo-400 font-semibold not-italic mr-1">AI Insight:</span>
          {item.ai_explanation || 'AI analysis pending...'}
        </p>
      </div>
    </div>
  );
}
