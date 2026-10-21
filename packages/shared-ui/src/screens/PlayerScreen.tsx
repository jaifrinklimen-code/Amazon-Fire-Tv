import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, Platform, StyleSheet, Text, BackHandler } from 'react-native';
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
import { sanitizeMediaUrl } from '../utils/sanitizeUrl';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;
type PlayerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

export default function PlayerScreen() {
  const route = useRoute<PlayerScreenRouteProp>();
  const navigation = useNavigation<PlayerScreenNavigationProp>();
  const { movie, headerImage, title, id } = route.params;
  const isFocused = useIsFocused();

  const [paused, setPaused] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackError, setPlaybackError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const videoRef = useRef<VideoRef>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  currentTimeRef.current = currentTime;
  durationRef.current = duration;

  const movieId = id ? String(id) : title ? String(title) : 'current-stream';

  // Validate playable stream URL
  const sanitizedMovieUrl = useMemo(() => {
    return sanitizeMediaUrl(movie);
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
      setPlaybackError(true);
    }
  }, [sanitizedMovieUrl]);

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
    setPaused((prev) => !prev);
    showControls();
  }, [showControls]);

  // Safe seek with finite non-negative bounds
  const seek = useCallback(
    (offset: number) => {
      const curDur = durationRef.current;
      const curTime = currentTimeRef.current;
      if (!Number.isFinite(curDur) || curDur <= 0) return;

      const newTime = Math.max(0, Math.min(curDur, curTime + offset));
      setCurrentTime(newTime);
      videoRef.current?.seek(newTime);
      showControls();
    },
    [showControls],
  );

  const handleProgress = useCallback(
    (time: number) => {
      if (!Number.isFinite(time) || time < 0) return;
      setCurrentTime(time);
      const curDur = durationRef.current;
      if (curDur > 0 && Number.isFinite(curDur)) {
        cinePilotStore.saveProgress(movieId, time, curDur);
      }
    },
    [movieId],
  );

  const handleLoad = useCallback(
    (dur: number) => {
      if (!Number.isFinite(dur) || dur <= 0) {
        setPlaybackError(true);
        return;
      }
      setDuration(dur);
      setPlaybackError(false);
      showControls();

      // Apply safe resume point
      if (initialResumeTime > 0 && initialResumeTime < dur) {
        setCurrentTime(initialResumeTime);
        videoRef.current?.seek(initialResumeTime);
      }
    },
    [initialResumeTime, showControls],
  );

  const handlePlaybackError = useCallback((err: unknown) => {
    console.warn('[CinePilot Player] Stream playback error:', err);
    setPlaybackError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setPlaybackError(false);
    setRetryKey((prev) => prev + 1);
    setCurrentTime(0);
  }, []);

  // Hardware Back & Remote Back Handler
  useEffect(() => {
    const onBackPress = () => {
      // Save progress on exit
      if (durationRef.current > 0 && currentTimeRef.current > 0) {
        cinePilotStore.saveProgress(movieId, currentTimeRef.current, durationRef.current);
      }
      navigation.goBack();
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    const handleKeyDown = (key: SupportedKeys) => {
      switch (key) {
        case SupportedKeys.Right:
        case SupportedKeys.FastForward:
          seek(10);
          break;
        case SupportedKeys.Left:
        case SupportedKeys.Rewind:
          seek(-10);
          break;
        case SupportedKeys.PlayPause:
        case SupportedKeys.Enter:
          togglePlayPause();
          break;
        case SupportedKeys.Back:
          onBackPress();
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
      // Persist final position on unmount
      if (durationRef.current > 0 && currentTimeRef.current > 0) {
        cinePilotStore.saveProgress(movieId, currentTimeRef.current, durationRef.current);
      }
    };
  }, [seek, togglePlayPause, showControls, navigation, movieId]);

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

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        {/* Real Video Player Component */}
        {!playbackError && sanitizedMovieUrl ? (
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
              if (duration > 0) {
                cinePilotStore.saveProgress(movieId, duration, duration);
              }
              navigation.goBack();
            }}
          />
        ) : null}

        {/* Playback Error Fallback Modal */}
        {playbackError && (
          <View style={styles.errorModalOverlay}>
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Playback Error</Text>
              <Text style={styles.errorDescription}>
                Unable to load stream. Please verify your connection or try again.
              </Text>

              <View style={styles.errorActionsRow}>
                <SpatialNavigationFocusableView onSelect={handleRetry}>
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View style={[styles.errorBtn, focused && styles.errorBtnFocused]}>
                      <Text style={[styles.errorBtnText, focused && styles.errorBtnTextFocused]}>
                        Retry Playback
                      </Text>
                    </View>
                  )}
                </SpatialNavigationFocusableView>

                <DefaultFocus>
                  <SpatialNavigationFocusableView onSelect={() => navigation.goBack()}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.errorBtnPrimary, focused && styles.errorBtnPrimaryFocused]}>
                        <Text style={styles.errorBtnPrimaryText}>
                          Return to Details
                        </Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                </DefaultFocus>
              </View>
            </View>
          </View>
        )}

        {/* Playback Controls Overlay matching Fire TV reference */}
        {!playbackError && controlsVisible && (
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  playToggleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playToggleBtnFocused: {
    backgroundColor: '#E50914',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  playToggleIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Error UI Modal
  errorModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 20, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  errorCard: {
    width: 520,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 36,
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  errorDescription: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  errorBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  errorBtnFocused: {
    borderColor: '#00A8E1',
    backgroundColor: '#253550',
    transform: [{ scale: 1.05 }],
  },
  errorBtnText: {
    color: '#E2E8F0',
    fontSize: 16,
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
    borderColor: '#00A8E1',
  },
  errorBtnPrimaryFocused: {
    backgroundColor: '#E50914',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  errorBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
