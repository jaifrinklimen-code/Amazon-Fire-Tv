import {
  CinePilotStorageManager,
  MemoryStorageProvider,
} from '../../../packages/shared-ui/src/data/cinePilotStore';

describe('Playback State Management, Resume Semantics & TV Back Hierarchy', () => {
  let memoryProvider: MemoryStorageProvider;
  let store: CinePilotStorageManager;

  beforeEach(() => {
    memoryProvider = new MemoryStorageProvider();
    store = new CinePilotStorageManager(memoryProvider);
  });

  describe('Resume Position Calculation & Bounds', () => {
    it('calculates correct resume point for mid-video progress', () => {
      store.saveProgress('stream-mid', 1800, 3600); // 50%
      const saved = store.getProgress('stream-mid');

      expect(saved).not.toBeNull();
      const resumePoint = saved ? Math.max(0, Math.min(saved.currentTime, saved.duration)) : 0;
      expect(resumePoint).toBe(1800);
    });

    it('restarts from 0 when saved progress exceeds 95% completion threshold', () => {
      store.saveProgress('stream-finished', 960, 1000); // 96%
      const saved = store.getProgress('stream-finished');

      const isCompleted = saved ? saved.duration > 0 && saved.currentTime / saved.duration >= 0.95 : false;
      const initialResumeTime = isCompleted ? 0 : saved?.currentTime ?? 0;

      expect(isCompleted).toBe(true);
      expect(initialResumeTime).toBe(0);
    });

    it('safely handles zero, negative, or corrupt progress values', () => {
      store.saveProgress('corrupt', -50, 100);
      expect(store.getProgress('corrupt')).toBeNull();

      store.saveProgress('zero-dur', 50, 0);
      expect(store.getProgress('zero-dur')).toBeNull();
    });
  });

  describe('Write Throttling & Immediate Flush Lifecycle', () => {
    it('buffers high-frequency progress callbacks and writes during flush', () => {
      // Simulate 10 high-frequency callbacks in 500ms
      for (let time = 10; time <= 20; time++) {
        store.saveProgressThrottled('high-freq', time, 1000);
      }

      // In-memory position is always immediately up-to-date
      expect(store.getProgress('high-freq')?.currentTime).toBe(20);

      // Explicit flush (e.g., on pause or screen exit)
      store.flushProgress();

      // Check persisted state in storage provider
      const serialized = memoryProvider.getItem(CinePilotStorageManager.PROGRESS_KEY);
      expect(serialized).not.toBeNull();
      const parsed = JSON.parse(serialized as string);
      expect(parsed['high-freq'].currentTime).toBe(20);
    });
  });

  describe('Back-Button Hierarchy Policy', () => {
    // Model of PlayerScreen hierarchical back decision tree
    function evaluateBackPressAction(
      hasPlaybackError: boolean,
      isControlsVisible: boolean,
    ): 'DISMISS_ERROR_AND_EXIT' | 'HIDE_CONTROLS' | 'SAVE_AND_NAVIGATE_BACK' {
      if (hasPlaybackError) {
        return 'DISMISS_ERROR_AND_EXIT';
      }
      if (isControlsVisible) {
        return 'HIDE_CONTROLS';
      }
      return 'SAVE_AND_NAVIGATE_BACK';
    }

    it('dismisses error modal and exits when in playback error state', () => {
      expect(evaluateBackPressAction(true, false)).toBe('DISMISS_ERROR_AND_EXIT');
      expect(evaluateBackPressAction(true, true)).toBe('DISMISS_ERROR_AND_EXIT');
    });

    it('hides controls overlay first if controls are visible without exiting screen', () => {
      expect(evaluateBackPressAction(false, true)).toBe('HIDE_CONTROLS');
    });

    it('persists progress and navigates back only when controls are dismissed', () => {
      expect(evaluateBackPressAction(false, false)).toBe('SAVE_AND_NAVIGATE_BACK');
    });

    it('debounces rapid duplicate back button events within 400ms threshold', () => {
      let lastBackPressTime = 0;
      let handledEventsCount = 0;

      const triggerBack = (timestamp: number) => {
        if (timestamp - lastBackPressTime < 400) {
          return false; // Debounced duplicate
        }
        lastBackPressTime = timestamp;
        handledEventsCount++;
        return true;
      };

      // Rapid burst from Android hardware + remote key event
      expect(triggerBack(1000)).toBe(true);
      expect(triggerBack(1050)).toBe(false); // Ignored duplicate
      expect(triggerBack(1120)).toBe(false); // Ignored duplicate

      // Subsequent deliberate back press 500ms later
      expect(triggerBack(1600)).toBe(true);
      expect(handledEventsCount).toBe(2);
    });
  });
});
