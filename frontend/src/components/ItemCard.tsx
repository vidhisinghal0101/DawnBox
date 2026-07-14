import React, { useState } from 'react';
import { Mail, AlertTriangle, Info, ExternalLink, CheckCircle2, Check, Clock } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { FeedItem, useFeedStore } from '../store';

export function ItemCard({ item }: { item: FeedItem }) {
  const isGithub = item.tool_name === 'github';
  const resolveItem = useFeedStore(state => state.resolveItem);
  const snoozeItem = useFeedStore(state => state.snoozeItem);
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
      className={`glass-panel rounded-xl p-5 hover:bg-zinc-800/80 transition-all group cursor-pointer border ${
        item.is_resolved ? 'border-green-500/20 opacity-75' : 'border-transparent hover:border-zinc-700/50'
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
            <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors flex items-start gap-2 max-w-[550px]">
              {item.title}
              <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-zinc-300">{item.author}</span>
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
            {!item.is_resolved ? (
              <div className="flex items-center gap-2 relative">
                <button 
                  onClick={handleResolve}
                  className="text-xs flex items-center gap-1.5 font-medium px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-green-500/20 text-zinc-400 hover:text-green-400 transition-colors border border-zinc-700 hover:border-green-500/30"
                >
                  <Check size={14} />
                  Mark as Done
                </button>
                <button 
                  onClick={handleSnoozeToggle}
                  className="text-xs flex items-center gap-1.5 font-medium px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-400 transition-colors border border-zinc-700 hover:border-yellow-500/30"
                >
                  <Clock size={14} />
                  Snooze
                </button>

                {/* Snooze Dropdown */}
                {showSnooze && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-10 py-1 overflow-hidden">
                    <button 
                      onClick={(e) => handleSnooze(e, 'today')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      Later Today (In 4 hrs)
                    </button>
                    <button 
                      onClick={(e) => handleSnooze(e, 'tomorrow')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      Tomorrow Morning (9 AM)
                    </button>
                    <button 
                      onClick={(e) => handleSnooze(e, 'next_week')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      Next Week (Mon 9 AM)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs flex items-center gap-1.5 font-medium px-2 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/20">
                <CheckCircle2 size={14} />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-zinc-300 text-sm mb-4 line-clamp-2 leading-relaxed">
        {item.content}
      </p>
      
      <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/50">
        <span className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${getTagStyle(item.priority_tag)}`}>
          {getTagIcon(item.priority_tag)}
          {item.priority_tag}
        </span>
        <p className="text-xs text-muted-foreground italic flex-1 leading-relaxed">
          <span className="text-blue-400/80 not-italic mr-1">AI Note:</span>
          {item.ai_explanation}
        </p>
      </div>
    </div>
  );
}
