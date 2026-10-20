import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View, Image, Text } from 'react-native';
import {
  SpatialNavigationRoot,
  SpatialNavigationScrollView,
  SpatialNavigationFocusableView,
  DefaultFocus,
} from 'react-tv-space-navigation';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { cinePilotStore } from '../data/cinePilotStore';
import PlatformLinearGradient from '../components/PlatformLinearGradient';

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
  const movieId = id || title;
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  useEffect(() => {
    setInWatchlist(cinePilotStore.isInWatchlist(movieId));
  }, [movieId, isFocused]);

  const toggleWatchlist = () => {
    const status = cinePilotStore.toggleWatchlist(movieId);
    setInWatchlist(status);
  };

  const formattedDuration = useMemo(() => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remMin}m`;
    }
    return `${minutes}m`;
  }, [duration]);

  const genreText = genres && genres.length > 0 ? genres.join(' • ') : 'Action • Sci-Fi';

  const navigateToPlayer = useCallback(() => {
    navigation.navigate('Player', {
      id: movieId,
      title: title,
      movie: movie,
      headerImage: headerImage,
    });
  }, [navigation, movieId, title, movie, headerImage]);

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        {/* Full-width Cinematic Backdrop */}
        {!imgFailed && headerImage ? (
          <Image
            source={{ uri: headerImage }}
            style={styles.backdropImage}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={styles.fallbackBackdrop} />
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
                    {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
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
  },
  backdropImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  fallbackBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#0A101D',
  },
  gradientLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '75%',
  },
  gradientBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  topBar: {
    paddingHorizontal: 48,
    paddingTop: 32,
    zIndex: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(14, 22, 38, 0.7)',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  backBtnFocused: {
    backgroundColor: '#00A8E1',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  contentArea: {
    position: 'absolute',
    left: 48,
    bottom: 60,
    maxWidth: 720,
    zIndex: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  metaItem: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
  },
  contentRatingBox: {
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  contentRatingText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  uhdBadge: {
    borderWidth: 1,
    borderColor: '#00A8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  uhdText: {
    color: '#00A8E1',
    fontSize: 11,
    fontWeight: '800',
  },
  description: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
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
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    gap: 10,
  },
  playBtnFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
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
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  actionBtnFocused: {
    borderColor: '#00A8E1',
    backgroundColor: '#1E293B',
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
