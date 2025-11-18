import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface Session {
  id: string;
  start: string;
  pauses: string[];
  resumes: string[];
  end: string | null;
  total_seconds: number;
}

export interface TimerState {
  is_running: boolean;
  is_paused: boolean;
  current_session_id: string | null;
  elapsed_seconds: number;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  regular_hours: number;
  overtime_hours: number;
  total_hours: number;
  session_count: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total_seconds: number;
  regular_hours: number;
  overtime_hours: number;
  session_count: number;
  longest_session_seconds: number;
  daily_breakdown: DailySummary[];
  weekly_breakdown: WeeklySummary[];
}

export interface DailySummary {
  date: string;
  total_seconds: number;
  session_count: number;
}

interface TimerStore {
  timerState: TimerState;
  currentTime: number;
  sessions: Session[];
  monthlySummary: MonthlySummary | null;
  
  // Actions
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  endTimer: () => Promise<void>;
  refreshTimerState: () => Promise<void>;
  fetchAllSessions: () => Promise<void>;
  fetchMonthlySummary: (year: number, month: number) => Promise<void>;
  exportSession: (session: Session) => Promise<string>;
  exportMonthlySummary: (year: number, month: number) => Promise<string>;
  tick: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  timerState: {
    is_running: false,
    is_paused: false,
    current_session_id: null,
    elapsed_seconds: 0,
  },
  currentTime: 0,
  sessions: [],
  monthlySummary: null,

  startTimer: async () => {
    try {
      await invoke('start_timer');
      await get().refreshTimerState();
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  },

  pauseTimer: async () => {
    try {
      await invoke('pause_timer');
      await get().refreshTimerState();
    } catch (error) {
      console.error('Failed to pause timer:', error);
      throw error;
    }
  },

  resumeTimer: async () => {
    try {
      await invoke('resume_timer');
      await get().refreshTimerState();
    } catch (error) {
      console.error('Failed to resume timer:', error);
      throw error;
    }
  },

  endTimer: async () => {
    try {
      const session = await invoke<Session>('end_timer');
      await get().refreshTimerState();
      await get().fetchAllSessions();
      
      // Auto-export session
      try {
        const exportPath = await get().exportSession(session);
        console.log('Session exported to:', exportPath);
      } catch (exportError) {
        console.error('Failed to export session:', exportError);
      }
    } catch (error) {
      console.error('Failed to end timer:', error);
      throw error;
    }
  },

  refreshTimerState: async () => {
    try {
      const state = await invoke<TimerState>('get_timer_state');
      set({ timerState: state });
    } catch (error) {
      console.error('Failed to refresh timer state:', error);
    }
  },

  fetchAllSessions: async () => {
    try {
      const sessions = await invoke<Session[]>('get_all_sessions');
      set({ sessions });
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  },

  fetchMonthlySummary: async (year: number, month: number) => {
    try {
      const summary = await invoke<MonthlySummary>('get_monthly_summary', { year, month });
      set({ monthlySummary: summary });
    } catch (error) {
      console.error('Failed to fetch monthly summary:', error);
    }
  },

  exportSession: async (session: Session) => {
    try {
      const path = await invoke<string>('export_session', { session });
      return path;
    } catch (error) {
      console.error('Failed to export session:', error);
      throw error;
    }
  },

  exportMonthlySummary: async (year: number, month: number) => {
    try {
      const path = await invoke<string>('export_monthly_summary', { year, month });
      return path;
    } catch (error) {
      console.error('Failed to export monthly summary:', error);
      throw error;
    }
  },

  tick: () => {
    set((state) => ({
      currentTime: state.currentTime + 1,
    }));
  },
}));
