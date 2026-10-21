import {
  CinePilotStorageManager,
  MemoryStorageProvider,
  SafeLocalStorageProvider,
  isValidId,
  isValidProgressRecord,
  normalizeSafeId,
  ProgressRecord,
} from '../../../packages/shared-ui/src/data/cinePilotStore';

describe('CinePilotStorageManager & Security Hardening', () => {
  let memoryProvider: MemoryStorageProvider;
  let store: CinePilotStorageManager;

  beforeEach(() => {
    memoryProvider = new MemoryStorageProvider();
    store = new CinePilotStorageManager(memoryProvider);
  });

  describe('ID Validation & Sanitization', () => {
    it('accepts valid alphanumeric, dashed, and underscored IDs', () => {
      expect(isValidId('the-boys')).toBe(true);
      expect(isValidId('reacher_2024')).toBe(true);
      expect(isValidId('movie.123')).toBe(true);
      expect(isValidId('dune-2')).toBe(true);
    });

    it('rejects empty strings, whitespace, and oversized IDs', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('   ')).toBe(false);
      expect(isValidId('a'.repeat(129))).toBe(false);
    });

    it('rejects prototype pollution vectors', () => {
      expect(isValidId('__proto__')).toBe(false);
      expect(isValidId('constructor')).toBe(false);
      expect(isValidId('prototype')).toBe(false);
    });

    it('normalizes numbers and strings safely', () => {
      expect(normalizeSafeId(42)).toBe('42');
      expect(normalizeSafeId('the-boys')).toBe('the-boys');
      expect(normalizeSafeId(null)).toBeNull();
      expect(normalizeSafeId(undefined)).toBeNull();
      expect(normalizeSafeId({})).toBeNull();
    });
  });

  describe('ProgressRecord Schema Validation', () => {
    it('accepts valid, bounded progress records', () => {
      const valid: ProgressRecord = {
        id: 'the-boys',
        currentTime: 120,
        duration: 3600,
        updatedAt: Date.now(),
      };
      expect(isValidProgressRecord(valid)).toBe(true);
    });

    it('rejects records with negative or non-finite values', () => {
      expect(
        isValidProgressRecord({
          id: 'test',
          currentTime: -5,
          duration: 100,
          updatedAt: Date.now(),
        }),
      ).toBe(false);

      expect(
        isValidProgressRecord({
          id: 'test',
          currentTime: NaN,
          duration: 100,
          updatedAt: Date.now(),
        }),
      ).toBe(false);

      expect(
        isValidProgressRecord({
          id: 'test',
          currentTime: 50,
          duration: Infinity,
          updatedAt: Date.now(),
        }),
      ).toBe(false);
    });

    it('rejects records where currentTime exceeds duration by more than 5 seconds', () => {
      expect(
        isValidProgressRecord({
          id: 'test',
          currentTime: 200,
          duration: 100,
          updatedAt: Date.now(),
        }),
      ).toBe(false);
    });

    it('rejects non-object or proto-polluted payloads', () => {
      expect(isValidProgressRecord(null)).toBe(false);
      expect(isValidProgressRecord('string')).toBe(false);
      expect(isValidProgressRecord([])).toBe(false);
    });
  });

  describe('Watchlist Management & Quota Limits', () => {
    it('initializes with default seed items', () => {
      expect(store.isInWatchlist('the-boys')).toBe(true);
      expect(store.isInWatchlist('reacher')).toBe(true);
      expect(store.isInWatchlist('non-existent')).toBe(false);
    });

    it('toggles watchlist items correctly', () => {
      const id = 'new-show-2026';
      expect(store.isInWatchlist(id)).toBe(false);

      const added = store.toggleWatchlist(id);
      expect(added).toBe(true);
      expect(store.isInWatchlist(id)).toBe(true);

      const removed = store.toggleWatchlist(id);
      expect(removed).toBe(false);
      expect(store.isInWatchlist(id)).toBe(false);
    });

    it('enforces maximum watchlist items to prevent storage exhaustion', () => {
      for (let i = 0; i < 550; i++) {
        store.toggleWatchlist(`show-${i}`);
      }
      expect(store.getWatchlist().length).toBeLessThanOrEqual(
        CinePilotStorageManager.MAX_WATCHLIST_ITEMS,
      );
    });
  });

  describe('Playback Progress Persistence', () => {
    it('saves and retrieves valid progress records', () => {
      store.saveProgress('fallout', 1500, 3600);
      const progress = store.getProgress('fallout');

      expect(progress).not.toBeNull();
      expect(progress?.id).toBe('fallout');
      expect(progress?.currentTime).toBe(1500);
      expect(progress?.duration).toBe(3600);
    });

    it('clamps currentTime to duration and ignores zero/negative duration', () => {
      store.saveProgress('overshoot', 4000, 3600);
      expect(store.getProgress('overshoot')?.currentTime).toBe(3600);

      store.saveProgress('invalid-duration', 100, 0);
      expect(store.getProgress('invalid-duration')).toBeNull();
    });

    it('sorts getAllProgress by updatedAt in descending order', () => {
      store.saveProgress('older', 100, 500);
      store.saveProgress('newer', 200, 500);

      const all = store.getAllProgress();
      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all[0].updatedAt).toBeGreaterThanOrEqual(all[1].updatedAt);
    });

    it('persists and hydrates state correctly from storage provider', () => {
      store.saveProgress('persist-test', 300, 600);

      // Create new instance pointing to same provider
      const rehydrated = new CinePilotStorageManager(memoryProvider);
      const prog = rehydrated.getProgress('persist-test');
      expect(prog).not.toBeNull();
      expect(prog?.currentTime).toBe(300);
    });
  });
});
