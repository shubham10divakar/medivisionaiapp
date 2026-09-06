import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PredictionResponse } from '@/services/api';
import { DEFAULT_MODEL } from '@/constants/models';

export interface RunRecord {
  id: string;
  imageUri: string;
  modelName: string;
  response: PredictionResponse;
  timestamp: number;
}

export interface AppUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  isGuest: boolean;
}

export type ServerStatus = 'idle' | 'checking' | 'ready' | 'offline';

// Synthetic identity used when Firebase isn't configured, or when the user
// chooses to try the app without an account. History stays on-device.
export const LOCAL_USER: AppUser = {
  uid: 'local',
  name: 'Local demo',
  email: null,
  photo: null,
  isGuest: true,
};

const STORAGE_KEY = 'medivision_state';
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://medivisionai.in/api';

interface AppState {
  user: AppUser | null;
  selectedModel: string;
  threshold: number;
  darkMode: boolean;
  history: RunRecord[];
  apiUrl: string;
  debugLogs: string[];
  serverStatus: ServerStatus;
  hasSeenOnboarding: boolean;
  coachMarksCompleted: string[];

  setUser: (user: AppUser | null) => void;
  setModel: (model: string) => void;
  setThreshold: (t: number) => void;
  toggleDarkMode: () => void;
  addRun: (record: RunRecord) => void;
  removeRun: (id: string) => void;
  clearHistory: () => void;
  setApiUrl: (url: string) => void;
  setServerStatus: (status: ServerStatus) => void;
  addDebugLog: (msg: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  markCoachDone: (id: string) => void;
  skipAllCoachMarks: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  selectedModel: DEFAULT_MODEL,
  threshold: 0.5,
  darkMode: true,
  history: [],
  apiUrl: DEFAULT_API_URL,
  debugLogs: [],
  serverStatus: 'idle',
  hasSeenOnboarding: false,
  coachMarksCompleted: [],

  setUser: (user) => set({ user }),

  setModel: (selectedModel) => {
    set({ selectedModel });
    save(get());
  },

  setThreshold: (threshold) => {
    set({ threshold });
    save(get());
  },

  toggleDarkMode: () => {
    set((s) => ({ darkMode: !s.darkMode }));
    save(get());
  },

  addRun: (record) => {
    const history = [record, ...get().history].slice(0, 50);
    set({ history });
    save({ ...get(), history });
  },

  removeRun: (id) => {
    const history = get().history.filter((r) => r.id !== id);
    set({ history });
    save({ ...get(), history });
  },

  clearHistory: () => {
    set({ history: [] });
    save({ ...get(), history: [] });
  },

  setApiUrl: (apiUrl) => {
    set({ apiUrl });
    save({ ...get(), apiUrl });
  },

  setServerStatus: (serverStatus) => set({ serverStatus }),

  addDebugLog: (msg) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    if (__DEV__) console.log(entry);
    set((s) => ({ debugLogs: [...s.debugLogs.slice(-49), entry] }));
  },

  completeOnboarding: () => {
    set({ hasSeenOnboarding: true });
    save(get());
  },

  resetOnboarding: () => {
    set({ hasSeenOnboarding: false });
    save(get());
  },

  markCoachDone: (id) => {
    if (get().coachMarksCompleted.includes(id)) return;
    const next = [...get().coachMarksCompleted, id];
    set({ coachMarksCompleted: next });
    save({ ...get(), coachMarksCompleted: next });
  },

  skipAllCoachMarks: () => {
    const all = ['home-cta', 'demo-model', 'history-first'];
    set({ coachMarksCompleted: all });
    save({ ...get(), coachMarksCompleted: all });
  },

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      set({
        selectedModel: saved.selectedModel ?? DEFAULT_MODEL,
        threshold: typeof saved.threshold === 'number' ? saved.threshold : 0.5,
        darkMode: saved.darkMode ?? true,
        history: saved.history ?? [],
        apiUrl: saved.apiUrl ?? DEFAULT_API_URL,
        hasSeenOnboarding: saved.hasSeenOnboarding ?? false,
        coachMarksCompleted: saved.coachMarksCompleted ?? [],
      });
    } catch {
      /* corrupt or unavailable storage — fall back to defaults */
    }
  },
}));

function save(state: AppState) {
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      selectedModel: state.selectedModel,
      threshold: state.threshold,
      darkMode: state.darkMode,
      history: state.history,
      apiUrl: state.apiUrl,
      hasSeenOnboarding: state.hasSeenOnboarding,
      coachMarksCompleted: state.coachMarksCompleted,
    }),
  ).catch(() => {});
}
