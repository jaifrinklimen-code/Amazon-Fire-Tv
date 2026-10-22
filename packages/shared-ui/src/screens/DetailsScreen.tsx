import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View, Image, Text, BackHandler } from 'react-native';
import {
  SpatialNavigationRoot,
  SpatialNavigationFocusableView,
  DefaultFocus,
} from 'react-tv-space-navigation';
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { cinePilotStore } from '../data/cinePilotStore';
import PlatformLinearGradient from '../components/PlatformLinearGradient';
import RemoteControlManager from '../app/remote-control/RemoteControlManager';
import { SupportedKeys } from '../app/remote-control/SupportedKeys';
import { sanitizeMediaUrl, DEFAULT_BACKDROP_FALLBACK } from '../utils/sanitizeUrl';
import { resolveBackdropUrl } from '../utils/mediaAssetResolver';

type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;
type DetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Details'>;

export default function DetailsScreen() {
  const route = useRoute<DetailsScreenRouteProp>();
  const navigation = useNavigation<DetailsScreenNavigationProp>();
  const {
    id,
    title,
    description,
    movie,
    headerImage,
    genres,
    releaseYear,
    rating,
    ratingCount,
    contentRating,
    duration,
  } = route.params;

  const isFocused = useIsFocused();
  const movieId = id ? String(id) : title ? String(title) : 'unknown';
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  useEffect(() => {
    setInWatchlist(cinePilotStore.isInWatchlist(movieId));
  }, [movieId, isFocused]);

  const toggleWatchlist = () => {
    const status = cinePilotStore.toggleWatchlist(movieId);
    setInWatchlist(status);
  };

  const lastBackPressTimeRef = useRef(0);

  // Hardware Back & Remote Back Handler
  useEffect(() => {
    const onBackPress = () => {
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 400) {
        return true;
      }
      lastBackPressTimeRef.current = now;
      navigation.goBack();
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    const handleKeyDown = (key: SupportedKeys) => {
      if (key === SupportedKeys.Back) {
        onBackPress();
      }
    };

    const remoteListener = RemoteControlManager.addKeydownListener(handleKeyDown);

    return () => {
      backHandlerSubscription.remove();
      RemoteControlManager.removeKeydownListener(remoteListener);
    };
  }, [navigation]);

  const formattedDuration = useMemo(() => {
    if (!duration || !Number.isFinite(duration)) return '';
    const minutes = Math.floor(duration / 60);
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remMin}m`;
    }
    return `${minutes}m`;
  }, [duration]);

  const safeHeaderImage = useMemo(() => {
    return resolveBackdropUrl(headerImage);
  }, [headerImage]);

  const genreText = genres && genres.length > 0 ? genres.join(' • ') : 'Action • Sci-Fi';

  const navigateToPlayer = useCallback(() => {
    navigation.navigate('Player', {
      id: movieId,
      title: title,
      movie: movie,
      headerImage: safeHeaderImage,
    });
  }, [navigation, movieId, title, movie, safeHeaderImage]);

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        {/* Full-width Cinematic Backdrop */}
        {!imgFailed ? (
          <Image
            source={{ uri: safeHeaderImage }}
            style={styles.backdropImage}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Image
            source={{ uri: DEFAULT_BACKDROP_FALLBACK }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        )}

        {/* Dual Cinematic Scrims */}
        <PlatformLinearGradient
          colors={['rgba(4,7,20,0.98)', 'rgba(4,7,20,0.85)', 'rgba(4,7,20,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLeft}
        />
        <PlatformLinearGradient
          colors={['transparent', 'rgba(4,7,20,0.7)', 'rgba(4,7,20,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBottom}
        />

        {/* Header Back Button & Breadcrumb */}
        <View style={styles.topBar}>
          <SpatialNavigationFocusableView onSelect={() => navigation.goBack()}>
            {({ isFocused: focused }: { isFocused: boolean }) => (
              <View style={[styles.backBtn, focused && styles.backBtnFocused]}>
                <Text style={styles.backBtnText}>← Back to Catalog</Text>
              </View>
            )}
          </SpatialNavigationFocusableView>
        </View>

        {/* Movie Info Area */}
        <View style={styles.contentArea}>
          <Text style={styles.title}>{title}</Text>

          {/* Metadata Row */}
          <View style={styles.metaRow}>
            {releaseYear && <Text style={styles.metaItem}>{releaseYear}</Text>}
            {contentRating && (
              <View style={styles.contentRatingBox}>
                <Text style={styles.contentRatingText}>{contentRating}</Text>
              </View>
            )}
            {formattedDuration ? <Text style={styles.metaItem}>{formattedDuration}</Text> : null}
            <Text style={styles.metaItem}>{genreText}</Text>
            {rating && (
              <Text style={styles.ratingText}>
                ★ {rating.toFixed(1)} ({ratingCount ? `${Math.round(ratingCount / 1000)}k` : '12k'})
              </Text>
            )}
            <View style={styles.uhdBadge}>
              <Text style={styles.uhdText}>UHD 4K</Text>
            </View>
          </View>

          {/* Synopsis */}
          <Text style={styles.description}>{description}</Text>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <DefaultFocus>
              <SpatialNavigationFocusableView onSelect={navigateToPlayer}>
                {({ isFocused: focused }: { isFocused: boolean }) => (
                  <View style={[styles.playBtn, focused && styles.playBtnFocused]}>
                    <Text style={styles.playIcon}>▶</Text>
                    <Text style={styles.playText}>Watch Now</Text>
                  </View>
                )}
              </SpatialNavigationFocusableView>
            </DefaultFocus>

            <SpatialNavigationFocusableView onSelect={toggleWatchlist}>
              {({ isFocused: focused }: { isFocused: boolean }) => (
                <View style={[styles.actionBtn, focused && styles.actionBtnFocused]}>
                  <Text style={styles.actionIcon}>{inWatchlist ? '✓' : '+'}</Text>
                  <Text style={styles.actionText}>
                    {inWatchlist ? 'In Watchlist' : 'Watchlist'}
                  </Text>
                </View>
              )}
            </SpatialNavigationFocusableView>
          </View>
        </View>
      </View>
    </SpatialNavigationRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040714',
    position: 'relative',
    justifyContent: 'center',
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '75%',
    zIndex: 1,
  },
  gradientBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    zIndex: 2,
  },
  topBar: {
    position: 'absolute',
    top: 36,
    left: 64,
    zIndex: 20,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(14, 22, 38, 0.7)',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  backBtnFocused: {
    borderColor: '#00A8E1',
    backgroundColor: '#1E2D4A',
    transform: [{ scale: 1.05 }],
  },
  backBtnText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  contentArea: {
    position: 'absolute',
    left: 64,
    bottom: 64,
    maxWidth: 720,
    zIndex: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  contentRatingBox: {
    borderWidth: 1,
    borderColor: '#64748B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentRatingText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  uhdBadge: {
    borderWidth: 1,
    borderColor: '#00A8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 168, 225, 0.15)',
  },
  uhdText: {
    color: '#00A8E1',
    fontSize: 11,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#94A3B8',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A8E1',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    gap: 10,
    borderWidth: 2,
    borderColor: '#00A8E1',
  },
  playBtnFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  playIcon: {
    color: '#040714',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playText: {
    color: '#040714',
    fontSize: 16,
    fontWeight: '800',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  actionBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#00A8E1',
    transform: [{ scale: 1.05 }],
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
