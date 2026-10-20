import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Platform, StyleSheet, Text, Image } from 'react-native';
import { SpatialNavigationRoot, SpatialNavigationFocusableView, DefaultFocus } from 'react-tv-space-navigation';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RemoteControlManager from '../app/remote-control/RemoteControlManager';
import { SupportedKeys } from '../app/remote-control/SupportedKeys';
import { VideoRef } from 'react-native-video';
import VideoPlayer from '../components/player/VideoPlayer';
import { RootStackParamList } from '../navigation/types';
import { cinePilotStore } from '../data/cinePilotStore';

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

  const videoRef = useRef<VideoRef>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const movieId = id || title || 'current-movie';

  // Load saved progress
  useEffect(() => {
    const saved = cinePilotStore.getProgress(movieId);
    if (saved && saved.currentTime > 0) {
      setCurrentTime(saved.currentTime);
      videoRef.current?.seek(saved.currentTime);
    }
  }, [movieId]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 6000);
  }, []);

  const togglePlayPause = useCallback(() => {
    setPaused((prev) => !prev);
    showControls();
  }, [showControls]);

  const seek = useCallback(
    (offset: number) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + offset));
      setCurrentTime(newTime);
      videoRef.current?.seek(newTime);
      showControls();
    },
    [currentTime, duration, showControls],
  );

  const handleProgress = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (duration > 0) {
        cinePilotStore.saveProgress(movieId, time, duration);
      }
    },
    [movieId, duration],
  );

  useEffect(() => {
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
          navigation.goBack();
          break;
        default:
          showControls();
          break;
      }
    };

    const listener = RemoteControlManager.addKeydownListener(handleKeyDown);
    return () => {
      RemoteControlManager.removeKeydownListener(listener);
    };
  }, [seek, togglePlayPause, showControls, navigation]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? `${(currentTime / duration) * 100}%` : '0%';

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        {/* Real Video Player Component */}
        <VideoPlayer
          ref={videoRef}
          movie={movie}
          headerImage={headerImage}
          paused={paused}
          controls={false}
          onBuffer={() => {}}
          onProgress={handleProgress}
          onLoad={(dur) => {
            setDuration(dur);
            setPlaybackError(false);
            showControls();
          }}
          onEnd={() => {
            setPaused(true);
            navigation.goBack();
          }}
        />

        {/* Playback Controls Overlay matching reference */}
        {controlsVisible && (
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
                  <View style={[styles.timelineProgress, { width: progressPercent as any }]} />
                </View>
                <Text style={styles.timeText}>{formatTime(duration || 0)}</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 22, 38, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  circleBtnFocused: {
    borderColor: '#00A8E1',
    backgroundColor: '#1E2D4A',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    backgroundColor: '#E50914', // Reference red seek progress
    borderRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(14, 22, 38, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  controlBtnFocused: {
    borderColor: '#00A8E1',
    transform: [{ scale: 1.1 }],
  },
  controlIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playToggleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playToggleBtnFocused: {
    backgroundColor: '#E50914',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  playToggleIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
