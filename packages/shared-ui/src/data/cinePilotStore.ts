import { CardData } from './moviesData';

export interface ProgressItem {
  id: string | number;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

// In-memory fallback and localStorage persistence for Web/TV
class CinePilotStorage {
  private watchlist: Set<string | number> = new Set(['jw4', 'dune2', 'batman']);
  private playbackProgress: Map<string | number, ProgressItem> = new Map([
    ['jw4', { id: 'jw4', currentTime: 4200, duration: 10140, updatedAt: Date.now() }],
    ['dune2', { id: 'dune2', currentTime: 6240, duration: 9960, updatedAt: Date.now() }],
    ['batman', { id: 'batman', currentTime: 3600, duration: 10560, updatedAt: Date.now() }],
    ['ahsoka', { id: 'ahsoka', currentTime: 1800, duration: 2700, updatedAt: Date.now() }],
  ]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const wl = window.localStorage.getItem('cinepilot_watchlist');
        if (wl) {
          const arr = JSON.parse(wl);
          this.watchlist = new Set(arr);
        }
        const prog = window.localStorage.getItem('cinepilot_progress');
        if (prog) {
          const obj: Record<string, ProgressItem> = JSON.parse(prog);
          Object.values(obj).forEach((p) => this.playbackProgress.set(p.id, p));
        }
      }
    } catch {
      // LocalStorage not available or parse error
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('cinepilot_watchlist', JSON.stringify(Array.from(this.watchlist)));
        const obj: Record<string, ProgressItem> = {};
        this.playbackProgress.forEach((v, k) => {
          obj[String(k)] = v;
        });
        window.localStorage.setItem('cinepilot_progress', JSON.stringify(obj));
      }
    } catch {
      // LocalStorage error
    }
  }

  public isInWatchlist(id: string | number): boolean {
    return this.watchlist.has(id);
  }

  public toggleWatchlist(id: string | number): boolean {
    if (this.watchlist.has(id)) {
      this.watchlist.delete(id);
    } else {
      this.watchlist.add(id);
    }
    this.saveToStorage();
    return this.watchlist.has(id);
  }

  public getWatchlist(): (string | number)[] {
    return Array.from(this.watchlist);
  }

  public saveProgress(id: string | number, currentTime: number, duration: number) {
    if (!duration || duration <= 0) return;
    this.playbackProgress.set(id, {
      id,
      currentTime,
      duration,
      updatedAt: Date.now(),
    });
    this.saveToStorage();
  }

  public getProgress(id: string | number): ProgressItem | undefined {
    return this.playbackProgress.get(id);
  }

  public getAllProgress(): ProgressItem[] {
    return Array.from(this.playbackProgress.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export const cinePilotStore = new CinePilotStorage();
