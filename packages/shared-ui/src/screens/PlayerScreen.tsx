import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, BackHandler } from 'react-native';
import {
  SpatialNavigationRoot,
  SpatialNavigationFocusableView,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { useIsFocused, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RemoteControlManager from '../app/remote-control/RemoteControlManager';
import { SupportedKeys } from '../app/remote-control/SupportedKeys';
import { VideoRef } from 'react-native-video';
import VideoPlayer from '../components/player/VideoPlayer';
import { RootStackParamList } from '../navigation/types';
import { cinePilotStore } from '../data/cinePilotStore';
import { resolveStreamUrl } from '../utils/mediaAssetResolver';
import { logDiagnostic } from '../utils/diagnostics';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;
type PlayerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'seeking'
  | 'error'
  | 'ended';

const MAX_RETRY_ATTEMPTS = 3;

export default function PlayerScreen() {
  const route = useRoute<PlayerScreenRouteProp>();
  const navigation = useNavigation<PlayerScreenNavigationProp>();
  const { movie, headerImage, title, id } = route.params;
  const isFocused = useIsFocused();

  const [playbackState, setPlaybackState] = useState<PlaybackState>('loading');
  const [paused, setPaused] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  const videoRef = useRef<VideoRef>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const lastBackActionTimeRef = useRef<number>(0);

  currentTimeRef.current = currentTime;
  durationRef.current = duration;

  const movieId = id ? String(id) : title ? String(title) : 'current-stream';

  // Validate playable stream URL through systematic resolver
  const sanitizedMovieUrl = useMemo(() => {
    return resolveStreamUrl(movie);
  }, [movie]);

  // Safe seek calculation during player initialization
  const initialResumeTime = useMemo(() => {
    if (!movieId) return 0;
    const saved = cinePilotStore.getProgress(movieId);
    if (!saved || !Number.isFinite(saved.currentTime) || !Number.isFinite(saved.duration)) {
      return 0;
    }
    // If user completed over 95%, restart from beginning
    if (saved.duration > 0 && saved.currentTime / saved.duration >= 0.95) {
      return 0;
    }
    return Math.max(0, Math.min(saved.currentTime, saved.duration));
  }, [movieId]);

  // Check initial stream validity
  useEffect(() => {
    if (!sanitizedMovieUrl) {
      logDiagnostic('PlaybackInitialization', 'error', 'init', 'Invalid or unplayable stream URL provided', movieId);
      setPlaybackState('error');
    }
  }, [sanitizedMovieUrl, movieId]);

  // Auto-hide controls timer
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 6000);
  }, []);

  useEffect(() => {
    showControls();
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const togglePlayPause = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      setPlaybackState(next ? 'paused' : 'playing');
      if (next && durationRef.current > 0) {
        // Immediate flush on pause
        cinePilotStore.saveProgress(movieId, currentTimeRef.current, durationRef.current);
      }
      return next;
    });
    showControls();
  }, [showControls, movieId]);

  // Safe seek with finite non-negative bounds
  const seek = useCallback(
    (offset: number) => {
      const curDur = durationRef.current;
      const curTime = currentTimeRef.current;
      if (!Number.isFinite(curDur) || curDur <= 0) return;

      const newTime = Math.max(0, Math.min(curDur, curTime + offset));
      setCurrentTime(newTime);
      setPlaybackState('seeking');
      videoRef.current?.seek(newTime);
      showControls();

      // Flush progress on manual seek
      cinePilotStore.saveProgress(movieId, newTime, curDur);
    },
    [showControls, movieId],
  );

  const handleProgress = useCallback(
    (time: number) => {
      if (!Number.isFinite(time) || time < 0) return;
      setCurrentTime(time);
      if (playbackState !== 'paused' && playbackState !== 'error' && playbackState !== 'ended') {
        setPlaybackState('playing');
      }
      const curDur = durationRef.current;
      if (curDur > 0 && Number.isFinite(curDur)) {
        // Throttled persistence prevents disk/flash thrashing on TV devices
        cinePilotStore.saveProgressThrottled(movieId, time, curDur);
      }
    },
    [movieId, playbackState],
  );

  const handleLoad = useCallback(
    (dur: number) => {
      if (!Number.isFinite(dur) || dur <= 0) {
        logDiagnostic('PlaybackError', 'error', 'onLoad', 'Stream metadata reported non-positive duration', movieId, { duration: dur });
        setPlaybackState('error');
        return;
      }
      setDuration(dur);
      setPlaybackState('ready');
      showControls();

      // Apply safe resume point
      if (initialResumeTime > 0 && initialResumeTime < dur) {
        setCurrentTime(initialResumeTime);
        videoRef.current?.seek(initialResumeTime);
      }
    },
    [initialResumeTime, showControls, movieId],
  );

  const handlePlaybackError = useCallback(
    (err: unknown) => {
      logDiagnostic('PlaybackError', 'error', 'onError', 'Playback error occurred during streaming', movieId, {
        error: String(err),
        retryCount,
      });
      setPlaybackState('error');
      // Save current position before error state
      if (durationRef.current > 0 && currentTimeRef.current > 0) {
        cinePilotStore.saveProgress(movieId, currentTimeRef.current, durationRef.current);
      }
    },
    [movieId, retryCount],
  );

  const handleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) return;

    logDiagnostic('PlaybackInitialization', 'info', 'retry', 'Retrying playback attempt', movieId, {
      attempt: retryCount + 1,
    });
    setRetryCount((prev) => prev + 1);
    setPlaybackState('loading');
    setRetryKey((prev) => prev + 1);
  }, [movieId, retryCount]);

  // Back-button Hierarchy & Remote Navigation
  useEffect(() => {
    const handleExitAndSave = () => {
      if (durationRef.current > 0 && currentTimeRef.current > 0) {
        cinePilotStore.saveProgress(movieId, currentTimeRef.current, durationRef.current);
      }
      cinePilotStore.flushProgress();
      navigation.goBack();
      return true;
    };

    const onBackPress = () => {
      const now = Date.now();
      // Debounce hardware and remote back events within 400ms to eliminate duplicate firing
      if (now - lastBackActionTimeRef.current < 400) {
        return true;
      }
      lastBackActionTimeRef.current = now;

      // 1. If playback error modal is active: exit to details
      if (playbackState === 'error') {
        return handleExitAndSave();
      }

      // 2. If controls overlay is active: hide controls first
      if (controlsVisible) {
        setControlsVisible(false);
        return true;
      }

      // 3. Otherwise: save progress and navigate back
      return handleExitAndSave();
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    const handleKeyDown = (key: SupportedKeys) => {
      switch (key) {
        // Dedicated media keys operate regardless of controls visibility
        case SupportedKeys.FastForward:
          seek(10);
          break;
        case SupportedKeys.Rewind:
          seek(-10);
          break;
        case SupportedKeys.PlayPause:
          togglePlayPause();
          break;
        case SupportedKeys.Back:
          onBackPress();
          break;

        // When controls are HIDDEN: Enter or directional keys reveal controls and trigger action
        case SupportedKeys.Enter:
          if (!controlsVisible) {
            togglePlayPause();
          }
          // When controls are visible, SpatialNavigation handles Enter on the focused button
          break;

        case SupportedKeys.Right:
          if (!controlsVisible) {
            seek(10);
          }
          // When controls are visible, SpatialNavigation handles moving focus between buttons
          break;

        case SupportedKeys.Left:
          if (!controlsVisible) {
            seek(-10);
          }
          // When controls are visible, SpatialNavigation handles moving focus between buttons
          break;

        default:
          showControls();
          break;
      }
    };

    const remoteListener = RemoteControlManager.addKeydownListener(handleKeyDown);

    return () => {
      backHandlerSubscription.remove();
      RemoteControlManager.removeKeydownListener(remoteListener);
      // Persist and flush final position on unmount
      if (durationRef.current > 0 && currentTimeRef.current > 0) {
        cinePilotStore.saveProgress(movieId, currentTimeRef.current, durationRef.current);
      }
      cinePilotStore.flushProgress();
    };
  }, [seek, togglePlayPause, showControls, navigation, movieId, controlsVisible, playbackState]);

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Safe progress percentage preventing division-by-zero or NaN
  const progressPercent = useMemo(() => {
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) {
      return 0;
    }
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const isErrorState = playbackState === 'error';
  const hasExceededMaxRetries = retryCount >= MAX_RETRY_ATTEMPTS;

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        {/* Real Video Player Component */}
        {!isErrorState && sanitizedMovieUrl ? (
          <VideoPlayer
            key={retryKey}
            ref={videoRef}
            movie={sanitizedMovieUrl}
            headerImage={headerImage}
            paused={paused}
            controls={false}
            onProgress={handleProgress}
            onLoad={handleLoad}
            onError={handlePlaybackError}
            onEnd={() => {
              setPaused(true);
              setPlaybackState('ended');
              if (duration > 0) {
                cinePilotStore.markCompleted(movieId, duration);
              }
              cinePilotStore.flushProgress();
              navigation.goBack();
            }}
          />
        ) : null}

        {/* Playback Error Fallback Modal */}
        {isErrorState && (
          <View style={styles.errorModalOverlay}>
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Playback Error</Text>
              <Text style={styles.errorDescription}>
                {hasExceededMaxRetries
                  ? 'Maximum playback retry attempts exceeded. Please check your network connection.'
                  : 'Unable to stream title. Please verify your connection or retry playback.'}
              </Text>

              <View style={styles.errorActionsRow}>
                {!hasExceededMaxRetries ? (
                  <SpatialNavigationFocusableView onSelect={handleRetry}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.errorBtn, focused && styles.errorBtnFocused]}>
                        <Text style={[styles.errorBtnText, focused && styles.errorBtnTextFocused]}>
                          Retry Playback ({retryCount + 1}/{MAX_RETRY_ATTEMPTS})
                        </Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                ) : null}

                <DefaultFocus>
                  <SpatialNavigationFocusableView onSelect={() => navigation.goBack()}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.errorBtnPrimary, focused && styles.errorBtnPrimaryFocused]}>
                        <Text style={styles.errorBtnPrimaryText}>Return to Details</Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                </DefaultFocus>
              </View>
            </View>
          </View>
        )}

        {/* Playback Controls Overlay matching Fire TV reference */}
        {!isErrorState && controlsVisible && (
          <View style={styles.overlayContainer}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <SpatialNavigationFocusableView onSelect={() => navigation.goBack()}>
                {({ isFocused: focused }: { isFocused: boolean }) => (
                  <View style={[styles.circleBtn, focused && styles.circleBtnFocused]}>
                    <Text style={styles.btnText}>←</Text>
                  </View>
                )}
              </SpatialNavigationFocusableView>

              <Text style={styles.videoTitle}>{title || 'CinePilot Stream'}</Text>

              <View style={styles.topRightActions}>
                <View style={styles.circleBtn}>
                  <Text style={styles.btnText}>💬</Text>
                </View>
                <View style={styles.circleBtn}>
                  <Text style={styles.btnText}>⚙</Text>
                </View>
              </View>
            </View>

            {/* Bottom Scrim & Timeline Controls */}
            <View style={styles.bottomBar}>
              {/* Timeline and Times */}
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <View style={styles.timelineBar}>
                  <View
                    style={[
                      styles.timelineProgress,
                      { width: `${progressPercent}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Action Buttons: Rewind, Play/Pause, Fast-Forward */}
              <View style={styles.controlsRow}>
                <SpatialNavigationFocusableView onSelect={() => seek(-10)}>
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View style={[styles.controlBtn, focused && styles.controlBtnFocused]}>
                      <Text style={styles.controlIcon}>↺ 10</Text>
                    </View>
                  )}
                </SpatialNavigationFocusableView>

                <DefaultFocus>
                  <SpatialNavigationFocusableView onSelect={togglePlayPause}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.playToggleBtn, focused && styles.playToggleBtnFocused]}>
                        <Text style={styles.playToggleIcon}>{paused ? '▶' : '❚❚'}</Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                </DefaultFocus>

                <SpatialNavigationFocusableView onSelect={() => seek(10)}>
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View style={[styles.controlBtn, focused && styles.controlBtnFocused]}>
                      <Text style={styles.controlIcon}>↻ 10</Text>
                    </View>
                  )}
                </SpatialNavigationFocusableView>
              </View>
            </View>
          </View>
        )}
      </View>
    </SpatialNavigationRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 20, 0.45)',
    justifyContent: 'space-between',
    padding: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(14, 22, 38, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  circleBtnFocused: {
    borderColor: '#00A8E1',
    backgroundColor: '#1E2D4A',
    transform: [{ scale: 1.1 }],
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomBar: {
    paddingBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  timeText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  timelineBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timelineProgress: {
    height: '100%',
    backgroundColor: '#E50914', // Fire TV / Prime Video red seek progress
    borderRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  controlBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(14, 22, 38, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  controlBtnFocused: {
    borderColor: '#00A8E1',
    backgroundColor: '#1E2D4A',
    transform: [{ scale: 1.12 }],
  },
  controlIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playToggleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00A8E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  playToggleBtnFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: '#0284C7',
    transform: [{ scale: 1.15 }],
  },
  playToggleIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  errorModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 20, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  errorCard: {
    width: 500,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorDescription: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  errorActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  errorBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  errorBtnFocused: {
    borderColor: '#00A8E1',
    backgroundColor: '#2D3748',
  },
  errorBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBtnTextFocused: {
    color: '#FFFFFF',
  },
  errorBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#00A8E1',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  errorBtnPrimaryFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: '#0284C7',
    transform: [{ scale: 1.05 }],
  },
  errorBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
