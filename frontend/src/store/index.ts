import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface FeedItem {
  id: string; // Changed to string to use external_id directly
  user_id: string;
  external_id: string;
  tool_name: string;
  title: string;
  content: string;
  author: string;
  priority_score: number;
  priority_tag: string;
  ai_explanation: string;
  timestamp: string;
  url: string;
  is_resolved: boolean;
  snoozed_until?: string | null;
}

export interface IntegrationDetail {
  connected: boolean;
  name?: string | null;
  image_url?: string | null;
}

interface RawFeedItem {
  external_id: string;
  tool_name: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  url: string;
  priority_score?: number;
  priority_tag?: string;
  ai_explanation?: string;
}

interface FeedStore {
  items: FeedItem[];
  snoozedItems: FeedItem[];
  briefing: string;
  loading: boolean;
  error: string | null;
  fetchStatus: 'idle' | 'running' | 'success' | 'error';
  analyzeStatus: 'idle' | 'running' | 'success' | 'error';
  integrationStatus: { github: IntegrationDetail, gmail: IntegrationDetail, slack: IntegrationDetail };
  fetchItems: (userId: string) => Promise<void>;
  fetchSnoozedItems: (userId: string) => Promise<void>;
  fetchBriefing: (userId: string) => Promise<void>;
  fetchIntegrationStatus: (userId: string) => Promise<void>;
  triggerFetch: (userId: string) => Promise<void>;
  triggerAnalyze: (userId: string) => Promise<void>;
  connectIntegration: (userId: string, toolName: string) => Promise<void>;
  disconnectIntegration: (userId: string, toolName: string) => Promise<void>;
  resolveItem: (itemId: string) => Promise<void>;
  snoozeItem: (itemId: string, snoozedUntil: string) => Promise<void>;
  unsnoozeItem: (itemId: string) => Promise<void>;
  submitFeedback: (itemId: string, actionTaken: string) => Promise<void>;
  clearError: () => void;
}

// LocalStorage helpers to run operations completely in-browser
const getLocalResolved = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('dawnbox_resolved_ids') || '[]');
  } catch {
    return [];
  }
};

const addLocalResolved = (externalId: string) => {
  if (typeof window === 'undefined') return;
  const resolved = getLocalResolved();
  if (!resolved.includes(externalId)) {
    resolved.push(externalId);
    localStorage.setItem('dawnbox_resolved_ids', JSON.stringify(resolved));
  }
};

const getLocalSnoozes = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('dawnbox_snoozes') || '{}');
  } catch {
    return {};
  }
};

const addLocalSnooze = (externalId: string, snoozedUntil: string) => {
  if (typeof window === 'undefined') return;
  const snoozes = getLocalSnoozes();
  snoozes[externalId] = snoozedUntil;
  localStorage.setItem('dawnbox_snoozes', JSON.stringify(snoozes));
};

const removeLocalSnooze = (externalId: string) => {
  if (typeof window === 'undefined') return;
  const snoozes = getLocalSnoozes();
  delete snoozes[externalId];
  localStorage.setItem('dawnbox_snoozes', JSON.stringify(snoozes));
};

export const useFeedStore = create<FeedStore>((set, get) => ({
  items: [],
  snoozedItems: [],
  briefing: '',
  loading: false,
  error: null,
  fetchStatus: 'idle',
  analyzeStatus: 'idle',
  integrationStatus: { 
    github: { connected: false }, 
    gmail: { connected: false }, 
    slack: { connected: false } 
  },

  clearError: () => set({ error: null }),

  fetchItems: async () => {
    // No-op: Data is kept in local state from triggerFetch response
  },

  fetchBriefing: async () => {
    // No-op: Summary is kept in local state from triggerAnalyze response
  },

  fetchSnoozedItems: async () => {
    // No-op: Snoozed items are updated dynamically in local state
  },

  fetchIntegrationStatus: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status/${userId}`);
      set({ integrationStatus: response.data });
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
    }
  },

  disconnectIntegration: async (userId: string, toolName: string) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/disconnect-tool`, {
        user_id: userId,
        tool_name: toolName
      });
      const currentStatus = { ...get().integrationStatus };
      if (toolName === 'github') currentStatus.github = { connected: false };
      if (toolName === 'gmail' || toolName === 'google') currentStatus.gmail = { connected: false };
      if (toolName === 'slack') currentStatus.slack = { connected: false };
      set({ integrationStatus: currentStatus });
    } catch {
      set({ error: 'Failed to disconnect integration.' });
    }
  },

  connectIntegration: async (userId: string, toolName: string) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/connect-tool`, { user_id: userId, tool_name: toolName });
      await get().fetchIntegrationStatus(userId);
    } catch (error) {
      console.error(`Failed to connect ${toolName}:`, error);
    }
  },

  triggerFetch: async (userId: string) => {
    set({ loading: true, error: null, fetchStatus: 'running' });
    try {
      const response = await axios.post(`${API_BASE_URL}/feed/fetch-data/${userId}`);
      const rawItems = response.data.items || [];
      
      const resolvedIds = getLocalResolved();
      const snoozes = getLocalSnoozes();
      const now = new Date();

      // Map raw items and filter out resolved/snoozed ones
      const mappedItems: FeedItem[] = [];
      const snoozedItems: FeedItem[] = [];

      rawItems.forEach((it: RawFeedItem) => {
        const item: FeedItem = {
          id: it.external_id, // Use external_id as primary key
          user_id: userId,
          external_id: it.external_id,
          tool_name: it.tool_name,
          title: it.title,
          content: it.content,
          author: it.author,
          timestamp: it.timestamp,
          url: it.url,
          priority_score: it.priority_score || 0,
          priority_tag: it.priority_tag || 'Uncategorized',
          ai_explanation: it.ai_explanation || 'Pending AI Analysis',
          is_resolved: resolvedIds.includes(it.external_id)
        };

        if (item.is_resolved) {
          return;
        }

        const snoozedUntilStr = snoozes[it.external_id];
        if (snoozedUntilStr) {
          const snoozedUntil = new Date(snoozedUntilStr);
          if (snoozedUntil > now) {
            item.snoozed_until = snoozedUntilStr;
            snoozedItems.push(item);
            return;
          } else {
            removeLocalSnooze(it.external_id);
          }
        }

        mappedItems.push(item);
      });

      set({ 
        items: mappedItems, 
        snoozedItems,
        loading: false, 
        fetchStatus: 'success'
      });
      setTimeout(() => set({ fetchStatus: 'idle' }), 3000);
    } catch (err) {
      console.error(err);
      set({ error: 'Failed to trigger fetch.', loading: false, fetchStatus: 'error' });
      setTimeout(() => set({ fetchStatus: 'idle', error: null }), 5000);
    }
  },

  triggerAnalyze: async (userId: string) => {
    set({ loading: true, error: null, analyzeStatus: 'running' });
    try {
      const response = await axios.post(`${API_BASE_URL}/feed/analyze-data/${userId}`, {
        items: get().items
      });
      
      const analyzedItems = response.data.items || [];
      const summary = response.data.summary || '';

      set({ 
        items: analyzedItems.map((it: FeedItem) => ({
          ...it,
          id: it.external_id // Ensure id matches external_id
        })), 
        briefing: summary, 
        loading: false, 
        analyzeStatus: 'success'
      });
      setTimeout(() => set({ analyzeStatus: 'idle' }), 3000);
    } catch (err) {
      console.error(err);
      set({ error: 'Failed to trigger analysis.', loading: false, analyzeStatus: 'error' });
      setTimeout(() => set({ analyzeStatus: 'idle', error: null }), 5000);
    }
  },

  resolveItem: async (itemId: string) => {
    const targetItem = get().items.find(item => item.id === itemId);
    if (!targetItem) return;

    // Optimistically update UI
    set(state => ({
      items: state.items.filter(item => item.id !== itemId)
    }));
    addLocalResolved(targetItem.external_id);

    try {
      await axios.put(`${API_BASE_URL}/feed/resolve`, {
        user_id: targetItem.user_id,
        tool_name: targetItem.tool_name,
        external_id: targetItem.external_id,
        title: targetItem.title,
        content: targetItem.content,
        timestamp: targetItem.timestamp
      });
    } catch (err) {
      console.error('Failed to resolve item:', err);
    }
  },

  snoozeItem: async (itemId: string, snoozedUntil: string) => {
    const targetItem = get().items.find(item => item.id === itemId);
    if (!targetItem) return;

    set(state => ({
      items: state.items.filter(item => item.id !== itemId),
      snoozedItems: [...state.snoozedItems, { ...targetItem, snoozed_until: snoozedUntil }]
    }));
    addLocalSnooze(targetItem.external_id, snoozedUntil);
  },

  unsnoozeItem: async (itemId: string) => {
    const targetItem = get().snoozedItems.find(item => item.id === itemId);
    if (!targetItem) return;

    set(state => ({
      snoozedItems: state.snoozedItems.filter(item => item.id !== itemId),
      items: [...state.items, { ...targetItem, snoozed_until: null }]
    }));
    removeLocalSnooze(targetItem.external_id);
  },

  submitFeedback: async (itemId: string, actionTaken: string) => {
    const targetItem = get().items.find(item => item.id === itemId);
    if (!targetItem) return;
    try {
      await axios.post(`${API_BASE_URL}/feed/items/feedback`, {
        user_id: targetItem.user_id,
        tool_name: targetItem.tool_name,
        title: targetItem.title,
        content: targetItem.content,
        action_taken: actionTaken
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }
}));
