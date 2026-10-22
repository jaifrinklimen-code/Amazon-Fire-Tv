/**
 * CinePilot AI - Secure Validated Storage Layer
 * Hardened state persistence adhering to IStorageProvider abstraction.
 * Implements canonical schema versioning, deterministic migration, empty watchlist retention,
 * write throttling, and prototype pollution guards.
 */

import { logDiagnostic } from '../utils/diagnostics';

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
  completed?: boolean;
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

// Resilient LocalStorage Provider with exception and quota guards
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
      logDiagnostic('StorageAccess', 'warn', 'getItem', 'SafeLocalStorage getItem fallback', undefined, { error: String(err) });
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
      logDiagnostic('StorageAccess', 'warn', 'setItem', 'SafeLocalStorage setItem fallback (quota/security)', undefined, { error: String(err) });
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
      logDiagnostic('StorageAccess', 'warn', 'removeItem', 'SafeLocalStorage removeItem fallback', undefined, { error: String(err) });
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

  const completedValid =
    item.completed === undefined || typeof item.completed === 'boolean';

  return idValid && currentTimeValid && durationValid && boundedCurrent && updatedAtValid && completedValid;
}

export const isValidProgress = isValidProgressRecord;

export class CinePilotStorageManager {
  public static readonly SCHEMA_VERSION = '1';
  public static readonly INITIALIZED_KEY = 'cinepilot_initialized_v1';
  public static readonly WATCHLIST_KEY = 'cinepilot_watchlist_v1';
  public static readonly PROGRESS_KEY = 'cinepilot_progress_v1';
  public static readonly LEGACY_WATCHLIST_KEY = 'cinepilot_watchlist';
  public static readonly LEGACY_PROGRESS_KEY = 'cinepilot_progress';

  public static readonly MAX_WATCHLIST_ITEMS = 500;
  public static readonly MAX_PROGRESS_ITEMS = 200;
  public static readonly COMPLETION_THRESHOLD = 0.95; // 95% threshold marks item complete

  private storageProvider: IStorageProvider;
  private memoryWatchlist: Set<string> = new Set();
  private memoryProgress: Map<string, ProgressRecord> = new Map();

  // Progress write throttling fields (prevents disk thrashing from 4Hz video callbacks)
  private pendingProgress: ProgressRecord | null = null;
  private lastPersistTime: number = 0;
  private readonly THROTTLE_INTERVAL_MS = 5000; // Persist to storage at most once every 5 seconds during playback

  constructor(provider?: IStorageProvider) {
    this.storageProvider = provider || new SafeLocalStorageProvider();
    this.hydrate();
  }

  private seedDefaultState(): void {
    const defaultWatchlist = ['the-boys', 'reacher', 'fallout'];
    defaultWatchlist.forEach((id) => this.memoryWatchlist.add(id));

    const defaultProgress: ProgressRecord[] = [
      { id: 'the-boys', currentTime: 4200, duration: 10140, updatedAt: Date.now() - 3600000, completed: false },
      { id: 'reacher', currentTime: 6240, duration: 9960, updatedAt: Date.now() - 7200000, completed: false },
      { id: 'summer-turned-pretty', currentTime: 1800, duration: 2700, updatedAt: Date.now() - 10800000, completed: false },
    ];
    defaultProgress.forEach((p) => this.memoryProgress.set(p.id, p));

    this.persistWatchlist();
    this.persistProgress();
    try {
      this.storageProvider.setItem(CinePilotStorageManager.INITIALIZED_KEY, CinePilotStorageManager.SCHEMA_VERSION);
    } catch {
      // Ignore initial marker failure
    }
  }

  private hydrate(): void {
    try {
      const isInitialized = this.storageProvider.getItem(CinePilotStorageManager.INITIALIZED_KEY);

      // 1. Hydrate Watchlist
      let rawWatchlist = this.storageProvider.getItem(CinePilotStorageManager.WATCHLIST_KEY);
      let migratedWatchlist = false;

      if (!rawWatchlist) {
        // Attempt legacy migration
        const legacyWatchlist = this.storageProvider.getItem(CinePilotStorageManager.LEGACY_WATCHLIST_KEY);
        if (legacyWatchlist) {
          rawWatchlist = legacyWatchlist;
          migratedWatchlist = true;
          logDiagnostic('SchemaMigration', 'info', 'hydrate', 'Migrating legacy watchlist to v1 schema');
        }
      }

      if (rawWatchlist !== null && typeof rawWatchlist === 'string') {
        try {
          const parsed = JSON.parse(rawWatchlist);
          if (Array.isArray(parsed)) {
            const validIds = parsed
              .map((item) => normalizeSafeId(item))
              .filter((id): id is string => id !== null)
              .slice(0, CinePilotStorageManager.MAX_WATCHLIST_ITEMS);

            // Crucial fix: even if validIds is empty ([]), respect user's cleared watchlist!
            this.memoryWatchlist = new Set(validIds);

            if (migratedWatchlist) {
              this.persistWatchlist();
              this.storageProvider.removeItem(CinePilotStorageManager.LEGACY_WATCHLIST_KEY);
            }
          }
        } catch (e) {
          logDiagnostic('StorageAccess', 'warn', 'hydrate', 'Malformed watchlist JSON, resetting watchlist safely', undefined, { error: String(e) });
          this.memoryWatchlist = new Set();
        }
      } else if (!isInitialized) {
        // First ever launch: seed default state
        this.seedDefaultState();
        return;
      }

      // 2. Hydrate Playback Progress
      let rawProgress = this.storageProvider.getItem(CinePilotStorageManager.PROGRESS_KEY);
      let migratedProgress = false;

      if (!rawProgress) {
        const legacyProgress = this.storageProvider.getItem(CinePilotStorageManager.LEGACY_PROGRESS_KEY);
        if (legacyProgress) {
          rawProgress = legacyProgress;
          migratedProgress = true;
          logDiagnostic('SchemaMigration', 'info', 'hydrate', 'Migrating legacy progress to v1 schema');
        }
      }

      if (rawProgress !== null && typeof rawProgress === 'string') {
        try {
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

            if (migratedProgress) {
              this.persistProgress();
              this.storageProvider.removeItem(CinePilotStorageManager.LEGACY_PROGRESS_KEY);
            }
          }
        } catch (e) {
          logDiagnostic('StorageAccess', 'warn', 'hydrate', 'Malformed progress JSON, resetting progress safely', undefined, { error: String(e) });
        }
      }

      // Ensure initialized flag is saved
      if (!isInitialized) {
        try {
          this.storageProvider.setItem(CinePilotStorageManager.INITIALIZED_KEY, CinePilotStorageManager.SCHEMA_VERSION);
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      logDiagnostic('StorageAccess', 'error', 'hydrate', 'Storage hydration exception, fallback to in-memory state', undefined, { error: String(err) });
    }
  }

  private persistWatchlist(): void {
    try {
      const serialized = JSON.stringify(Array.from(this.memoryWatchlist));
      this.storageProvider.setItem(CinePilotStorageManager.WATCHLIST_KEY, serialized);
    } catch (err) {
      logDiagnostic('StorageAccess', 'warn', 'persistWatchlist', 'Unable to persist watchlist', undefined, { error: String(err) });
    }
  }

  private persistProgress(): void {
    try {
      const obj = Object.fromEntries(this.memoryProgress.entries());
      const serialized = JSON.stringify(obj);
      this.storageProvider.setItem(CinePilotStorageManager.PROGRESS_KEY, serialized);
      this.lastPersistTime = Date.now();
    } catch (err) {
      logDiagnostic('StorageAccess', 'warn', 'persistProgress', 'Unable to persist progress', undefined, { error: String(err) });
    }
  }

  // ==========================================
  // Domain Operations: Watchlist
  // ==========================================

  public isInWatchlist(id: string | number): boolean {
    const safeId = normalizeSafeId(id);
    if (!safeId) return false;
    return this.memoryWatchlist.has(safeId);
  }

  public addToWatchlist(id: string | number): boolean {
    const safeId = normalizeSafeId(id);
    if (!safeId) return false;

    if (this.memoryWatchlist.size >= CinePilotStorageManager.MAX_WATCHLIST_ITEMS) {
      const oldest = this.memoryWatchlist.values().next().value;
      if (oldest) this.memoryWatchlist.delete(oldest);
    }

    this.memoryWatchlist.add(safeId);
    this.persistWatchlist();
    return true;
  }

  public removeFromWatchlist(id: string | number): boolean {
    const safeId = normalizeSafeId(id);
    if (!safeId) return false;

    const existed = this.memoryWatchlist.delete(safeId);
    if (existed) {
      this.persistWatchlist();
    }
    return existed;
  }

  public toggleWatchlist(id: string | number): boolean {
    const safeId = normalizeSafeId(id);
    if (!safeId) return false;

    if (this.memoryWatchlist.has(safeId)) {
      this.removeFromWatchlist(safeId);
      return false;
    } else {
      this.addToWatchlist(safeId);
      return true;
    }
  }

  public getWatchlist(): string[] {
    return Array.from(this.memoryWatchlist);
  }

  public clearWatchlist(): void {
    this.memoryWatchlist.clear();
    this.persistWatchlist();
  }

  // ==========================================
  // Domain Operations: Playback Progress
  // ==========================================

  /**
   * Immediately saves playback progress to memory and persistent storage.
   */
  public saveProgress(
    id: string | number,
    currentTime: number,
    duration: number,
    isCompleted?: boolean,
  ): void {
    const safeId = normalizeSafeId(id);
    if (!safeId) return;
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return;
    if (currentTime < 0 || duration <= 0) return;

    const clampedDuration = duration;
    const clampedCurrent = Math.min(currentTime, clampedDuration);
    const completed =
      isCompleted !== undefined
        ? isCompleted
        : clampedDuration > 0 && clampedCurrent / clampedDuration >= CinePilotStorageManager.COMPLETION_THRESHOLD;

    const record: ProgressRecord = {
      id: safeId,
      currentTime: clampedCurrent,
      duration: clampedDuration,
      updatedAt: Date.now(),
      completed,
    };

    if (!isValidProgressRecord(record)) return;

    if (
      !this.memoryProgress.has(safeId) &&
      this.memoryProgress.size >= CinePilotStorageManager.MAX_PROGRESS_ITEMS
    ) {
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
    this.pendingProgress = null;
  }

  /**
   * Throttled progress update: saves to in-memory store immediately,
   * but buffers persistent disk writes to at most once every THROTTLE_INTERVAL_MS.
   */
  public saveProgressThrottled(id: string | number, currentTime: number, duration: number): void {
    const safeId = normalizeSafeId(id);
    if (!safeId) return;
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return;
    if (currentTime < 0 || duration <= 0) return;

    const clampedDuration = duration;
    const clampedCurrent = Math.min(currentTime, clampedDuration);
    const completed = clampedDuration > 0 && clampedCurrent / clampedDuration >= CinePilotStorageManager.COMPLETION_THRESHOLD;

    const record: ProgressRecord = {
      id: safeId,
      currentTime: clampedCurrent,
      duration: clampedDuration,
      updatedAt: Date.now(),
      completed,
    };

    if (!isValidProgressRecord(record)) return;

    // Update memory representation immediately
    this.memoryProgress.set(safeId, record);
    this.pendingProgress = record;

    const now = Date.now();
    if (now - this.lastPersistTime >= this.THROTTLE_INTERVAL_MS) {
      this.persistProgress();
      this.pendingProgress = null;
    }
  }

  /**
   * Forces an immediate persistent flush of any pending throttled progress.
   * Call on player pause, exit, unmount, or application backgrounding.
   */
  public flushProgress(): void {
    if (this.pendingProgress) {
      this.persistProgress();
      this.pendingProgress = null;
    }
  }

  public getProgress(id: string | number): ProgressRecord | null {
    const safeId = normalizeSafeId(id);
    if (!safeId) return null;
    return this.memoryProgress.get(safeId) ?? null;
  }

  public getAllProgress(): ProgressRecord[] {
    return Array.from(this.memoryProgress.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public markCompleted(id: string | number, duration?: number): void {
    const safeId = normalizeSafeId(id);
    if (!safeId) return;

    const existing = this.memoryProgress.get(safeId);
    const resolvedDuration = duration ?? existing?.duration ?? 100;

    this.saveProgress(safeId, resolvedDuration, resolvedDuration, true);
  }

  public isCompleted(id: string | number): boolean {
    const safeId = normalizeSafeId(id);
    if (!safeId) return false;
    const record = this.memoryProgress.get(safeId);
    if (!record) return false;
    return (
      record.completed === true ||
      (record.duration > 0 && record.currentTime / record.duration >= CinePilotStorageManager.COMPLETION_THRESHOLD)
    );
  }

  public clearProgress(id: string | number): void {
    const safeId = normalizeSafeId(id);
    if (!safeId) return;
    if (this.memoryProgress.delete(safeId)) {
      this.persistProgress();
    }
  }

  public clearAll(): void {
    this.memoryWatchlist.clear();
    this.memoryProgress.clear();
    this.pendingProgress = null;
    try {
      this.storageProvider.removeItem(CinePilotStorageManager.WATCHLIST_KEY);
      this.storageProvider.removeItem(CinePilotStorageManager.PROGRESS_KEY);
      this.storageProvider.setItem(CinePilotStorageManager.INITIALIZED_KEY, CinePilotStorageManager.SCHEMA_VERSION);
    } catch {
      // Ignore cleanup error
    }
  }
}

export const cinePilotStore = new CinePilotStorageManager();
