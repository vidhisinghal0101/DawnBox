import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface FeedItem {
  id: number;
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

interface FeedStore {
  items: FeedItem[];
  snoozedItems: FeedItem[];
  briefing: string;
  loading: boolean;
  error: string | null;
  fetchStatus: 'idle' | 'running' | 'success' | 'error';
  analyzeStatus: 'idle' | 'running' | 'success' | 'error';
  integrationStatus: { github: boolean, gmail: boolean, slack: boolean };
  fetchItems: (userId: string) => Promise<void>;
  fetchSnoozedItems: (userId: string) => Promise<void>;
  fetchBriefing: (userId: string) => Promise<void>;
  fetchIntegrationStatus: (userId: string) => Promise<void>;
  triggerFetch: (userId: string) => Promise<void>;
  triggerAnalyze: (userId: string) => Promise<void>;
  connectIntegration: (userId: string, toolName: string) => Promise<void>;
  disconnectIntegration: (userId: string, toolName: string) => Promise<void>;
  resolveItem: (itemId: number) => Promise<void>;
  snoozeItem: (itemId: number, snoozedUntil: string) => Promise<void>;
  unsnoozeItem: (itemId: number) => Promise<void>;
  submitFeedback: (itemId: number, actionTaken: string) => Promise<void>;
  clearError: () => void;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  items: [],
  snoozedItems: [],
  briefing: '',
  loading: false,
  error: null,
  fetchStatus: 'idle',
  analyzeStatus: 'idle',
  integrationStatus: { github: false, gmail: false, slack: false },

  clearError: () => set({ error: null }),

  fetchItems: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feed/items/${userId}`);
      set({ items: response.data });
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  },

  fetchBriefing: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feed/briefing/${userId}`);
      set({ briefing: response.data.content });
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    }
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
      // Optimistically update the status locally
      const currentStatus = { ...get().integrationStatus };
      if (toolName === 'github') currentStatus.github = false;
      if (toolName === 'gmail' || toolName === 'google') currentStatus.gmail = false;
      if (toolName === 'slack') currentStatus.slack = false;
      set({ integrationStatus: currentStatus });
    } catch {
      set({ error: 'Failed to disconnect integration.' });
    }
  },

  connectIntegration: async (userId: string, toolName: string) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/connect-tool`, { user_id: userId, tool_name: toolName });
      // Refresh status after connection
      await get().fetchIntegrationStatus(userId);
    } catch (error) {
      console.error(`Failed to connect ${toolName}:`, error);
    }
  },

  fetchSnoozedItems: async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feed/items/${userId}/snoozed`);
      set({ snoozedItems: response.data });
    } catch (err) {
      console.error('Failed to fetch snoozed items:', err);
    }
  },

  triggerFetch: async (userId: string) => {
    set({ loading: true, error: null, fetchStatus: 'running' });
    try {
      await axios.post(`${API_BASE_URL}/feed/fetch-data/${userId}`);
      
      let attempts = 0;
      const maxAttempts = 10;
      
      const poll = async () => {
        attempts++;
        try {
          const itemsRes = await axios.get(`${API_BASE_URL}/feed/items/${userId}`);
          const newItems = itemsRes.data;
          const currentItems = get().items;
          
          const hasNewData = newItems.length !== currentItems.length || 
            (newItems.length > 0 && currentItems.length > 0 && newItems[0]?.id !== currentItems[0]?.id);
          
          if (hasNewData || attempts >= maxAttempts) {
            set({ 
              items: newItems, 
              loading: false, 
              fetchStatus: hasNewData ? 'success' : 'success'
            });
            setTimeout(() => set({ fetchStatus: 'idle' }), 3000);
          } else {
            setTimeout(poll, 3000);
          }
        } catch {
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
          } else {
            set({ loading: false, fetchStatus: 'error', error: 'Fetch timed out. Please try again.' });
            setTimeout(() => set({ fetchStatus: 'idle', error: null }), 5000);
          }
        }
      };
      
      setTimeout(poll, 4000);
    } catch {
      set({ error: 'Failed to trigger fetch.', loading: false, fetchStatus: 'error' });
      setTimeout(() => set({ fetchStatus: 'idle', error: null }), 5000);
    }
  },

  triggerAnalyze: async (userId: string) => {
    set({ loading: true, error: null, analyzeStatus: 'running' });
    try {
      await axios.post(`${API_BASE_URL}/feed/analyze-data/${userId}`);
      
      let attempts = 0;
      const maxAttempts = 10;
      
      const poll = async () => {
        attempts++;
        try {
          const itemsRes = await axios.get(`${API_BASE_URL}/feed/items/${userId}`);
          const briefingRes = await axios.get(`${API_BASE_URL}/feed/briefing/${userId}`);
          
          const newItems = itemsRes.data;
          const newBriefing = briefingRes.data.content;
          const currentBriefing = get().briefing;
          
          const hasNewData = newBriefing !== currentBriefing || 
            (newItems.length > 0 && newItems[0]?.priority_tag !== 'Uncategorized');
          
          if (hasNewData || attempts >= maxAttempts) {
            set({ 
              items: newItems, 
              briefing: newBriefing, 
              loading: false, 
              analyzeStatus: hasNewData ? 'success' : 'success'
            });
            setTimeout(() => set({ analyzeStatus: 'idle' }), 3000);
          } else {
            setTimeout(poll, 3000);
          }
        } catch {
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
          } else {
            set({ loading: false, analyzeStatus: 'error', error: 'Analysis timed out. Please try again.' });
            setTimeout(() => set({ analyzeStatus: 'idle', error: null }), 5000);
          }
        }
      };
      
      setTimeout(poll, 4000);
    } catch {
      set({ error: 'Failed to trigger analysis.', loading: false, analyzeStatus: 'error' });
      setTimeout(() => set({ analyzeStatus: 'idle', error: null }), 5000);
    }
  },

  resolveItem: async (itemId: number) => {
    // Optimistically update UI
    set(state => ({
      items: state.items.map(item => 
        item.id === itemId ? { ...item, is_resolved: true } : item
      )
    }));

    try {
      await axios.put(`${API_BASE_URL}/feed/items/${itemId}/resolve`);
    } catch (err) {
      // Revert if failed
      console.error('Failed to resolve item:', err);
      set(state => ({
        items: state.items.map(item => 
          item.id === itemId ? { ...item, is_resolved: false } : item
        )
      }));
    }
  },

  snoozeItem: async (itemId: number, snoozedUntil: string) => {
    const targetItem = get().items.find(item => item.id === itemId);
    
    set(state => ({
      items: state.items.filter(item => item.id !== itemId),
      snoozedItems: targetItem 
        ? [...state.snoozedItems, { ...targetItem, snoozed_until: snoozedUntil }] 
        : state.snoozedItems
    }));
    try {
      await axios.post(`${API_BASE_URL}/feed/items/${itemId}/snooze`, { snoozed_until: snoozedUntil });
    } catch (err) {
      console.error('Failed to snooze item:', err);
    }
  },

  unsnoozeItem: async (itemId: number) => {
    const targetItem = get().snoozedItems.find(item => item.id === itemId);
    
    set(state => ({
      snoozedItems: state.snoozedItems.filter(item => item.id !== itemId),
      items: targetItem 
        ? [...state.items, { ...targetItem, snoozed_until: null }] 
        : state.items
    }));
    try {
      await axios.post(`${API_BASE_URL}/feed/items/${itemId}/unsnooze`);
    } catch (err) {
      console.error('Failed to unsnooze item:', err);
    }
  },

  submitFeedback: async (itemId: number, actionTaken: string) => {
    try {
      await axios.post(`${API_BASE_URL}/feed/items/${itemId}/feedback`, { action_taken: actionTaken });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }
}));
