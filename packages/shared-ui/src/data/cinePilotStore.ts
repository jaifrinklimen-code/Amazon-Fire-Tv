/**
 * CinePilot AI - Secure Validated Storage Layer
 * Hardened state persistence adhering to IStorageProvider abstraction.
 * Implements strict schema validation, proto-pollution guards, and storage quota limits.
 */

export interface IStorageProvider {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface ProgressItem {
  id: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export type ProgressRecord = ProgressItem;

// In-Memory Storage Provider (Universal fallback for SSR, React Native without DOM, or private quota limits)
export class MemoryStorageProvider implements IStorageProvider {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Resilient Web LocalStorage Provider with exception and quota guards
export class SafeLocalStorageProvider implements IStorageProvider {
  private fallback: MemoryStorageProvider = new MemoryStorageProvider();

  private isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__cinepilot_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isAvailable()) {
      return this.fallback.getItem(key);
    }
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      console.warn('[CinePilotStore] SafeLocalStorage getItem fallback:', err);
      return this.fallback.getItem(key);
    }
  }

  setItem(key: string, value: string): void {
    if (!this.isAvailable()) {
      this.fallback.setItem(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn('[CinePilotStore] SafeLocalStorage setItem fallback (quota/security):', err);
      this.fallback.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    if (!this.isAvailable()) {
      this.fallback.removeItem(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn('[CinePilotStore] SafeLocalStorage removeItem fallback:', err);
      this.fallback.removeItem(key);
    }
  }
}

/**
 * Strict ID validation guard
 * Rejects empty strings, strings exceeding 128 chars, non-alphanumeric chars,
 * and prototype pollution vectors (__proto__, constructor, prototype).
 */
export function isValidId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > 128) return false;
  if (trimmed === '__proto__' || trimmed === 'constructor' || trimmed === 'prototype') {
    return false;
  }
  return /^[a-zA-Z0-9_\-\.]+$/.test(trimmed);
}

/**
 * Helper to normalize string | number ID input into a validated safe string ID
 */
export function normalizeSafeId(rawId: string | number | unknown): string | null {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return String(rawId);
  }
  if (typeof rawId === 'string' && isValidId(rawId)) {
    return rawId.trim();
  }
  return null;
}

/**
 * Strict ProgressRecord runtime schema validator
 * Ensures finite, non-negative bounds and guards against malformed payloads.
 */
export function isValidProgressRecord(val: unknown): val is ProgressRecord {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false;

  // Guard against prototype pollution
  if (
    Object.prototype.hasOwnProperty.call(val, '__proto__') ||
    Object.prototype.hasOwnProperty.call(val, 'constructor') ||
    Object.prototype.hasOwnProperty.call(val, 'prototype')
  ) {
    return false;
  }

  const item = val as Record<string, unknown>;

  const idValid = isValidId(item.id);
  const currentTimeValid =
    typeof item.currentTime === 'number' &&
    Number.isFinite(item.currentTime) &&
    item.currentTime >= 0;

  const durationValid =
    typeof item.duration === 'number' &&
    Number.isFinite(item.duration) &&
    item.duration >= 0;

  const boundedCurrent =
    currentTimeValid && durationValid
      ? (item.currentTime as number) <= (item.duration as number) + 5
      : false;

  const updatedAtValid =
    typeof item.updatedAt === 'number' &&
    Number.isFinite(item.updatedAt) &&
    item.updatedAt > 0;

  return idValid && currentTimeValid && durationValid && boundedCurrent && updatedAtValid;
}

export const isValidProgress = isValidProgressRecord;

export class CinePilotStorageManager {
  public static readonly WATCHLIST_KEY = 'cinepilot_watchlist_v1';
  public static readonly PROGRESS_KEY = 'cinepilot_progress_v1';
  private static readonly LEGACY_WATCHLIST_KEY = 'cinepilot_watchlist';
  private static readonly LEGACY_PROGRESS_KEY = 'cinepilot_progress';

  public static readonly MAX_WATCHLIST_ITEMS = 500;
  public static readonly MAX_PROGRESS_ITEMS = 200;

  private storageProvider: IStorageProvider;
  private memoryWatchlist: Set<string> = new Set();
  private memoryProgress: Map<string, ProgressRecord> = new Map();

  constructor(provider?: IStorageProvider) {
    this.storageProvider = provider || new SafeLocalStorageProvider();
    this.seedDefaultState();
    this.hydrate();
  }

  private seedDefaultState(): void {
    const defaultWatchlist = ['the-boys', 'reacher', 'fallout'];
    defaultWatchlist.forEach((id) => this.memoryWatchlist.add(id));

    const defaultProgress: ProgressRecord[] = [
      { id: 'the-boys', currentTime: 4200, duration: 10140, updatedAt: Date.now() - 3600000 },
      { id: 'reacher', currentTime: 6240, duration: 9960, updatedAt: Date.now() - 7200000 },
      { id: 'summer-turned-pretty', currentTime: 1800, duration: 2700, updatedAt: Date.now() - 10800000 },
    ];
    defaultProgress.forEach((p) => this.memoryProgress.set(p.id, p));
  }

  private hydrate(): void {
    try {
      // 1. Hydrate Watchlist
      let rawWatchlist = this.storageProvider.getItem(CinePilotStorageManager.WATCHLIST_KEY);
      if (!rawWatchlist) {
        rawWatchlist = this.storageProvider.getItem(CinePilotStorageManager.LEGACY_WATCHLIST_KEY);
      }

      if (rawWatchlist && typeof rawWatchlist === 'string') {
        const parsed = JSON.parse(rawWatchlist);
        if (Array.isArray(parsed)) {
          const validIds = parsed
            .map((item) => normalizeSafeId(item))
            .filter((id): id is string => id !== null)
            .slice(0, CinePilotStorageManager.MAX_WATCHLIST_ITEMS);

          if (validIds.length > 0) {
            this.memoryWatchlist = new Set(validIds);
          }
        }
      }

      // 2. Hydrate Playback Progress
      let rawProgress = this.storageProvider.getItem(CinePilotStorageManager.PROGRESS_KEY);
      if (!rawProgress) {
        rawProgress = this.storageProvider.getItem(CinePilotStorageManager.LEGACY_PROGRESS_KEY);
      }

      if (rawProgress && typeof rawProgress === 'string') {
        const parsed = JSON.parse(rawProgress);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          let count = 0;
          for (const [key, val] of Object.entries(parsed)) {
            if (count >= CinePilotStorageManager.MAX_PROGRESS_ITEMS) break;
            if (isValidId(key) && isValidProgressRecord(val)) {
              this.memoryProgress.set(key, val);
              count++;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[CinePilotStore] Storage hydration error, gracefully using in-memory state:', err);
    }
  }

  private persistWatchlist(): void {
    try {
      const serialized = JSON.stringify(Array.from(this.memoryWatchlist));
      this.storageProvider.setItem(CinePilotStorageManager.WATCHLIST_KEY, serialized);
    } catch (err) {
      console.warn('[CinePilotStore] Unable to persist watchlist:', err);
    }
  }

  private persistProgress(): void {
    try {
      const obj = Object.fromEntries(this.memoryProgress.entries());
      const serialized = JSON.stringify(obj);
      this.storageProvider.setItem(CinePilotStorageManager.PROGRESS_KEY, serialized);
    } catch (err) {
      console.warn('[CinePilotStore] Unable to persist progress:', err);
    }
  }

  public isInWatchlist(id: string | number): boolean {
    const safeId = normalizeSafeId(id);
    if (!safeId) return false;
    return this.memoryWatchlist.has(safeId);
  }

  public toggleWatchlist(id: string | number): boolean {
    const safeId = normalizeSafeId(id);
    if (!safeId) return false;

    if (this.memoryWatchlist.has(safeId)) {
      this.memoryWatchlist.delete(safeId);
    } else {
      if (this.memoryWatchlist.size >= CinePilotStorageManager.MAX_WATCHLIST_ITEMS) {
        // Remove oldest entry to prevent exhaustion attack
        const first = this.memoryWatchlist.values().next().value;
        if (first) this.memoryWatchlist.delete(first);
      }
      this.memoryWatchlist.add(safeId);
    }

    this.persistWatchlist();
    return this.memoryWatchlist.has(safeId);
  }

  public getWatchlist(): string[] {
    return Array.from(this.memoryWatchlist);
  }

  public saveProgress(id: string | number, currentTime: number, duration: number): void {
    const safeId = normalizeSafeId(id);
    if (!safeId) return;
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return;

    const clampedDuration = Math.max(0, duration);
    if (clampedDuration === 0) return;

    const clampedCurrent = Math.max(0, Math.min(currentTime, clampedDuration));

    const record: ProgressRecord = {
      id: safeId,
      currentTime: clampedCurrent,
      duration: clampedDuration,
      updatedAt: Date.now(),
    };

    if (!isValidProgressRecord(record)) return;

    if (
      !this.memoryProgress.has(safeId) &&
      this.memoryProgress.size >= CinePilotStorageManager.MAX_PROGRESS_ITEMS
    ) {
      // Evict oldest updated progress record
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.memoryProgress.entries()) {
        if (v.updatedAt < oldestTime) {
          oldestTime = v.updatedAt;
          oldestKey = k;
        }
      }
      if (oldestKey) {
        this.memoryProgress.delete(oldestKey);
      }
    }

    this.memoryProgress.set(safeId, record);
    this.persistProgress();
  }

  public getProgress(id: string | number): ProgressRecord | null {
    const safeId = normalizeSafeId(id);
    if (!safeId) return null;
    return this.memoryProgress.get(safeId) ?? null;
  }

  public getAllProgress(): ProgressRecord[] {
    return Array.from(this.memoryProgress.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public clearAll(): void {
    this.memoryWatchlist.clear();
    this.memoryProgress.clear();
    try {
      this.storageProvider.removeItem(CinePilotStorageManager.WATCHLIST_KEY);
      this.storageProvider.removeItem(CinePilotStorageManager.PROGRESS_KEY);
    } catch {
      // Ignore cleanup error
    }
  }
}

export const cinePilotStore = new CinePilotStorageManager();
