import React from 'react';
import { Mail, AlertTriangle, Info, BellOff, ExternalLink, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FeedItem } from '../store';

const GithubSVG = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

export function ItemCard({ item }: { item: FeedItem }) {
  const isGithub = item.tool_name === 'github';
  
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

  return (
    <div 
      onClick={handleClick}
      className="glass-panel rounded-xl p-5 hover:bg-zinc-800/80 transition-all group cursor-pointer border border-transparent hover:border-zinc-700/50"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center min-w-[50px]">
            <div className={`p-2 rounded-lg mb-1.5 ${isGithub ? 'bg-zinc-800 text-white' : 'bg-red-500/10 text-red-500'}`}>
              {isGithub ? <GithubSVG size={20} /> : <Mail size={20} />}
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
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-1 rounded-md ${getScoreColor(item.priority_score)} bg-black/40`}>
              Score: {item.priority_score}/10
            </span>
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
        <p className="text-xs text-muted-foreground italic truncate flex-1">
          <span className="text-blue-400/80 not-italic mr-1">AI Note:</span>
          {item.ai_explanation}
        </p>
      </div>
    </div>
  );
}
