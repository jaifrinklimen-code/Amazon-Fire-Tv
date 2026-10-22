import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Image, Text, ScrollView, BackHandler } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SpatialNavigationFocusableView,
  SpatialNavigationRoot,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { RootStackParamList } from '../navigation/types';
import { CINEPILOT_CATALOG } from '../data/cinePilotCatalog';
import { CardData } from '../data/moviesData';
import { cinePilotStore } from '../data/cinePilotStore';
import PlatformLinearGradient from '../components/PlatformLinearGradient';
import TopNavigationBar from '../components/TopNavigationBar';
import RemoteControlManager from '../app/remote-control/RemoteControlManager';
import { SupportedKeys } from '../app/remote-control/SupportedKeys';
import {
  sanitizeMediaUrl,
  DEFAULT_POSTER_FALLBACK,
  DEFAULT_BACKDROP_FALLBACK,
} from '../utils/sanitizeUrl';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DrawerNavigator'>;

// Standard Portrait Card (2:3 Aspect Ratio, Poster Fills Container, Title & Meta Beneath)
const MovieCard = React.memo(
  ({
    item,
    isFocused,
    showProgress = false,
  }: {
    item: CardData;
    isFocused: boolean;
    showProgress?: boolean;
  }) => {
    const [imgFailed, setImgFailed] = useState(false);

    // Sanitize image URI with fallback
    const safeImageUri = useMemo(() => {
      return (
        sanitizeMediaUrl(item.posterUrl) ||
        sanitizeMediaUrl(item.headerImage) ||
        sanitizeMediaUrl(item.backdropUrl) ||
        DEFAULT_POSTER_FALLBACK
      );
    }, [item.posterUrl, item.headerImage, item.backdropUrl]);

    const progressPercent = item.progress ? `${Math.round(item.progress * 100)}%` : '40%';
    const timeLeft = item.progress
      ? item.progress > 0.8
        ? '8m left'
        : item.progress > 0.5
        ? '32m left'
        : '1h 10m left'
      : '45m left';

    return (
      <View style={styles.cardWrapper}>
        {/* 2:3 Poster Image Box */}
        <View style={[styles.posterBox, isFocused && styles.posterBoxFocused]}>
          {!imgFailed ? (
            <Image
              source={{ uri: safeImageUri }}
              style={styles.posterImage}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <Image
              source={{ uri: DEFAULT_POSTER_FALLBACK }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          )}

          {/* Progress bar at the bottom of the poster for Continue Watching */}
          {showProgress && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressPercent as any }]} />
            </View>
          )}
        </View>

        {/* Separate text area beneath the poster */}
        <View style={styles.cardInfoBeneath}>
          <Text style={[styles.cardTitleBeneath, isFocused && styles.cardTitleFocused]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardMetaBeneath} numberOfLines={1}>
            {showProgress
              ? timeLeft
              : `${item.releaseYear || 2024} • ${item.genres ? item.genres[0] : item.category || 'Feature'}`}
          </Text>
        </View>
      </View>
    );
  },
);

// Prime Video Signature Top 10 Card (Ranking Number to Left + 2:3 Poster + Title Beneath)
const TopTenCard = React.memo(
  ({
    item,
    rank,
    isFocused,
  }: {
    item: CardData;
    rank: number;
    isFocused: boolean;
  }) => {
    const [imgFailed, setImgFailed] = useState(false);

    const safeImageUri = useMemo(() => {
      return (
        sanitizeMediaUrl(item.posterUrl) ||
        sanitizeMediaUrl(item.headerImage) ||
        sanitizeMediaUrl(item.backdropUrl) ||
        DEFAULT_POSTER_FALLBACK
      );
    }, [item.posterUrl, item.headerImage, item.backdropUrl]);

    return (
      <View style={styles.topTenItemWrapper}>
        <View style={styles.topTenRowLayout}>
          {/* Dedicated ranking number strictly to the LEFT of the poster */}
          <View style={styles.rankNumContainer}>
            <Text
              style={[
                styles.rankNum,
                rank >= 10 && styles.rankNumDoubleDigit,
                isFocused && styles.rankNumFocused,
              ]}
            >
              {rank}
            </Text>
          </View>

          {/* 2:3 Portrait Card: Poster fills image box */}
          <View style={[styles.posterBox, isFocused && styles.posterBoxFocused]}>
            {!imgFailed ? (
              <Image
                source={{ uri: safeImageUri }}
                style={styles.posterImage}
                resizeMode="cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <Image
                source={{ uri: DEFAULT_POSTER_FALLBACK }}
                style={styles.posterImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>

        {/* Text area beneath poster, aligned with the poster */}
        <View style={styles.topTenInfoBeneath}>
          <Text style={[styles.cardTitleBeneath, isFocused && styles.cardTitleFocused]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardMetaBeneath} numberOfLines={1}>
            {item.releaseYear || 2024} • {item.category === 'TV Shows' ? 'TV Series' : 'Movie'}
          </Text>
        </View>
      </View>
    );
  },
);

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const isFocused = useIsFocused();
  const pageScrollRef = useRef<any>(null);

  // Dynamic featured title in Hero, defaulting to first item
  const [featuredItem, setFeaturedItem] = useState<CardData>(CINEPILOT_CATALOG[0]);
  const [inWatchlist, setInWatchlist] = useState<boolean>(() =>
    cinePilotStore.isInWatchlist(CINEPILOT_CATALOG[0].id),
  );
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);

  // Update watchlist state when featured item changes
  useEffect(() => {
    setInWatchlist(cinePilotStore.isInWatchlist(featuredItem.id));
  }, [featuredItem.id]);

  const toggleHeroWatchlist = useCallback(() => {
    const nextStatus = cinePilotStore.toggleWatchlist(featuredItem.id);
    setInWatchlist(nextStatus);
  }, [featuredItem.id]);

  // Content Rows Data
  const topTenItems = useMemo(() => CINEPILOT_CATALOG.slice(0, 10), []);
  const continueWatchingItems = useMemo(
    () => CINEPILOT_CATALOG.filter((m) => m.progress && m.progress > 0),
    [],
  );
  const popularMovies = useMemo(
    () => CINEPILOT_CATALOG.filter((m) => m.category === 'Movies'),
    [],
  );
  const popularTVShows = useMemo(
    () => CINEPILOT_CATALOG.filter((m) => m.category === 'TV Shows'),
    [],
  );
  const sciFiAction = useMemo(
    () =>
      CINEPILOT_CATALOG.filter(
        (m) =>
          m.genres?.includes('Action') ||
          m.genres?.includes('Science Fiction') ||
          m.genres?.includes('Sci-Fi'),
      ),
    [],
  );

  const navigateToPlayer = useCallback(
    (item: CardData) => {
      navigation.navigate('Player', {
        id: item.id,
        title: item.title,
        movie: item.movie,
        headerImage: item.backdropUrl || item.headerImage || item.posterUrl,
      });
    },
    [navigation],
  );

  const navigateToDetails = useCallback(
    (item: CardData) => {
      navigation.navigate('Details', {
        id: item.id,
        title: item.title,
        description: item.description,
        headerImage: item.backdropUrl || item.headerImage || item.posterUrl,
        movie: item.movie,
        category: item.category,
        genres: item.genres,
        releaseYear: item.releaseYear,
        rating: item.rating,
        ratingCount: item.ratingCount,
        contentRating: item.contentRating,
        duration: item.duration,
      });
    },
    [navigation],
  );

  const lastBackPressTimeRef = useRef<number>(0);

  const handleCardFocus = useCallback((item: CardData, rowYOffset: number) => {
    setFeaturedItem(item);
    setInWatchlist(cinePilotStore.isInWatchlist(item.id));
    pageScrollRef.current?.scrollTo({ y: rowYOffset, animated: true });
  }, []);

  // Hardware Back & Remote Back Button Handling
  useEffect(() => {
    const onBackPress = () => {
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 400) {
        return true;
      }
      lastBackPressTimeRef.current = now;

      if (exitModalVisible) {
        setExitModalVisible(false);
        return true;
      }
      setExitModalVisible(true);
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
  }, [exitModalVisible]);

  const safeHeroBackdropUri = useMemo(() => {
    return (
      sanitizeMediaUrl(featuredItem.backdropUrl) ||
      sanitizeMediaUrl(featuredItem.headerImage) ||
      sanitizeMediaUrl(featuredItem.posterUrl) ||
      DEFAULT_BACKDROP_FALLBACK
    );
  }, [featuredItem.backdropUrl, featuredItem.headerImage, featuredItem.posterUrl]);

  return (
    <SpatialNavigationRoot isActive={isFocused && !exitModalVisible}>
      <View style={styles.pageContainer}>
        {/* Horizontal Navigation Bar fixed at top */}
        <TopNavigationBar activeRoute="Home" />

        {/* Scrollable Page Body with No Horizontal Leakage */}
        <ScrollView
          ref={pageScrollRef}
          style={styles.pageScrollView}
          contentContainerStyle={styles.pageScrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* =========================================
              1. HERO SECTION (Safe Left Alignment: 64px)
             ========================================= */}
          <View style={styles.heroSection}>
            {/* Cinematic Full-width Backdrop Image */}
            <Image
              source={{ uri: safeHeroBackdropUri }}
              style={styles.heroBackdropImage}
              resizeMode="cover"
            />

            {/* Left-to-right gradient scrim for text readability */}
            <PlatformLinearGradient
              colors={[
                'rgba(4, 7, 20, 0.98)',
                'rgba(4, 7, 20, 0.88)',
                'rgba(4, 7, 20, 0.55)',
                'rgba(4, 7, 20, 0.15)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 0 }}
              style={styles.heroScrimLeft}
            />

            {/* Subtle bottom gradient blending into content rows */}
            <PlatformLinearGradient
              colors={['transparent', 'rgba(4, 7, 20, 0.5)', '#040714']}
              start={{ x: 0, y: 0.4 }}
              end={{ x: 0, y: 1 }}
              style={styles.heroScrimBottom}
            />

            {/* Hero Content Column: Inset cleanly by 64px, perfectly aligned with nav */}
            <View style={styles.heroContentColumn}>
              {/* Title */}
              <Text style={styles.heroTitle} numberOfLines={2}>
                {featuredItem.title.toUpperCase()}
              </Text>

              {/* Subtitle / Episode line */}
              <Text style={styles.heroSubtitle}>
                {featuredItem.category === 'TV Shows' ? 'New episode available' : 'Now Streaming in 4K UHD'}
              </Text>

              {/* Metadata Row: Stars, Count, Year, Seasons, Genre, Badges */}
              <View style={styles.heroMetaRow}>
                <View style={styles.starsGroup}>
                  <Text style={styles.starsText}>★★★★★</Text>
                  <Text style={styles.ratingCount}>
                    {featuredItem.ratingCount ? featuredItem.ratingCount.toLocaleString() : '12,560'}
                  </Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.metaItem}>{featuredItem.releaseYear || 2024}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.metaItem}>
                  {featuredItem.category === 'TV Shows' ? '4 seasons' : '2h 15m'}
                </Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.metaItem}>
                  {featuredItem.genres ? featuredItem.genres.slice(0, 2).join(' • ') : 'Action'}
                </Text>

                {/* Rating badge */}
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>{featuredItem.contentRating || 'TV-MA'}</Text>
                </View>

                {/* UHD badge */}
                <View style={styles.uhdBadge}>
                  <Text style={styles.uhdBadgeText}>UHD</Text>
                </View>
              </View>

              {/* Synopsis */}
              <Text style={styles.heroSynopsis} numberOfLines={3}>
                {featuredItem.description}
              </Text>

              {/* Prime Inclusion Indicator */}
              <View style={styles.includedRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.includedText}>Included with CinePilot</Text>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.heroActionsRow}>
                {/* Watch Now Button */}
                <DefaultFocus>
                  <SpatialNavigationFocusableView onSelect={() => navigateToPlayer(featuredItem)}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.watchNowBtn, focused && styles.watchNowBtnFocused]}>
                        <Text style={styles.watchNowIcon}>▶</Text>
                        <Text style={styles.watchNowText}>Watch now</Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                </DefaultFocus>

                {/* Add to Watchlist Circle Button */}
                <SpatialNavigationFocusableView onSelect={toggleHeroWatchlist}>
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View style={[styles.circleActionBtn, focused && styles.circleActionBtnFocused]}>
                      <Text style={styles.circleActionIcon}>{inWatchlist ? '✓' : '+'}</Text>
                    </View>
                  )}
                </SpatialNavigationFocusableView>

                {/* More Details Button */}
                <SpatialNavigationFocusableView onSelect={() => navigateToDetails(featuredItem)}>
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View style={[styles.moreInfoBtn, focused && styles.moreInfoBtnFocused]}>
                      <Text style={styles.moreInfoIcon}>ℹ</Text>
                      <Text style={styles.moreInfoText}>More details</Text>
                    </View>
                  )}
                </SpatialNavigationFocusableView>
              </View>
            </View>
          </View>

          {/* =========================================
              2. CONTENT CAROUSELS ROWS (Left: 64px)
             ========================================= */}
          <View style={styles.rowsContainer}>
            {/* Row 1: TOP 10 */}
            <View style={styles.rowSection}>
              <Text style={styles.rowHeaderTitle}>Top 10</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowScrollContent}
              >
                {topTenItems.map((item, idx) => (
                  <SpatialNavigationFocusableView
                    key={item.id}
                    onSelect={() => navigateToDetails(item)}
                  >
                    {({ isFocused: focused }: { isFocused: boolean }) => {
                      if (focused && featuredItem.id !== item.id) {
                        handleCardFocus(item, 0);
                      }
                      return <TopTenCard item={item} rank={idx + 1} isFocused={focused} />;
                    }}
                  </SpatialNavigationFocusableView>
                ))}
              </ScrollView>
            </View>

            {/* Row 2: CONTINUE WATCHING */}
            {continueWatchingItems.length > 0 && (
              <View style={styles.rowSection}>
                <Text style={styles.rowHeaderTitle}>Continue Watching</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rowScrollContent}
                >
                  {continueWatchingItems.map((item) => (
                    <SpatialNavigationFocusableView
                      key={item.id}
                      onSelect={() => navigateToPlayer(item)}
                    >
                      {({ isFocused: focused }: { isFocused: boolean }) => {
                        if (focused && featuredItem.id !== item.id) {
                          handleCardFocus(item, 80);
                        }
                        return <MovieCard item={item} isFocused={focused} showProgress={true} />;
                      }}
                    </SpatialNavigationFocusableView>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Row 3: TV SHOWS WE THINK YOU'LL LIKE */}
            <View style={styles.rowSection}>
              <Text style={styles.rowHeaderTitle}>TV shows we think you'll like</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowScrollContent}
              >
                {popularTVShows.map((item) => (
                  <SpatialNavigationFocusableView
                    key={item.id}
                    onSelect={() => navigateToDetails(item)}
                  >
                    {({ isFocused: focused }: { isFocused: boolean }) => {
                      if (focused && featuredItem.id !== item.id) {
                        handleCardFocus(item, 180);
                      }
                      return <MovieCard item={item} isFocused={focused} />;
                    }}
                  </SpatialNavigationFocusableView>
                ))}
              </ScrollView>
            </View>

            {/* Row 4: ACTION & SCI-FI THRILLERS */}
            <View style={styles.rowSection}>
              <Text style={styles.rowHeaderTitle}>Action & Sci-Fi Thrillers</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowScrollContent}
              >
                {sciFiAction.map((item) => (
                  <SpatialNavigationFocusableView
                    key={item.id}
                    onSelect={() => navigateToDetails(item)}
                  >
                    {({ isFocused: focused }: { isFocused: boolean }) => {
                      if (focused && featuredItem.id !== item.id) {
                        handleCardFocus(item, 280);
                      }
                      return <MovieCard item={item} isFocused={focused} />;
                    }}
                  </SpatialNavigationFocusableView>
                ))}
              </ScrollView>
            </View>

            {/* Row 5: POPULAR MOVIES */}
            <View style={styles.rowSection}>
              <Text style={styles.rowHeaderTitle}>Top Movies on CinePilot</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowScrollContent}
              >
                {popularMovies.map((item) => (
                  <SpatialNavigationFocusableView
                    key={item.id}
                    onSelect={() => navigateToDetails(item)}
                  >
                    {({ isFocused: focused }: { isFocused: boolean }) => {
                      if (focused && featuredItem.id !== item.id) {
                        handleCardFocus(item, 380);
                      }
                      return <MovieCard item={item} isFocused={focused} />;
                    }}
                  </SpatialNavigationFocusableView>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        {/* TV Hardware Back Exit Dialog */}
        {exitModalVisible && (
          <SpatialNavigationRoot isActive={isFocused && exitModalVisible}>
            <View style={styles.exitModalOverlay}>
              <View style={styles.exitDialogCard}>
                <Text style={styles.exitDialogTitle}>Exit CinePilot AI?</Text>
                <Text style={styles.exitDialogSubtitle}>
                  Are you sure you want to exit the application?
                </Text>

                <View style={styles.exitDialogActions}>
                  <SpatialNavigationFocusableView onSelect={() => BackHandler.exitApp()}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.exitBtn, focused && styles.exitBtnFocused]}>
                        <Text style={[styles.exitBtnText, focused && styles.exitBtnTextFocused]}>
                          Exit App
                        </Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>

                  <DefaultFocus>
                    <SpatialNavigationFocusableView onSelect={() => setExitModalVisible(false)}>
                      {({ isFocused: focused }: { isFocused: boolean }) => (
                        <View style={[styles.cancelBtn, focused && styles.cancelBtnFocused]}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </View>
                      )}
                    </SpatialNavigationFocusableView>
                  </DefaultFocus>
                </View>
              </View>
            </View>
          </SpatialNavigationRoot>
        )}
      </View>
    </SpatialNavigationRoot>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#040714',
    overflow: 'hidden',
  },
  pageScrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  pageScrollContent: {
    paddingBottom: 80,
  },

  // 1. HERO SECTION STYLES
  heroSection: {
    height: 520,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  heroBackdropImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroScrimLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '72%',
    zIndex: 2,
  },
  heroScrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    zIndex: 3,
  },
  heroContentColumn: {
    position: 'absolute',
    left: 64, // Perfectly aligns with TopNav & Content rows
    bottom: 36,
    maxWidth: 640,
    zIndex: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 48,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    color: '#00A8E1',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  starsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsText: {
    color: '#F59E0B',
    fontSize: 13,
    letterSpacing: 1.5,
  },
  ratingCount: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    color: '#64748B',
    fontSize: 13,
  },
  metaItem: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  uhdBadge: {
    borderWidth: 1,
    borderColor: '#64748B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  uhdBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSynopsis: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
    maxWidth: 560,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  checkIcon: {
    color: '#00A8E1',
    fontSize: 14,
    fontWeight: '900',
  },
  includedText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  watchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A8E1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: '#00A8E1',
  },
  watchNowBtnFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  watchNowIcon: {
    color: '#040714',
    fontSize: 14,
    fontWeight: '900',
  },
  watchNowText: {
    color: '#040714',
    fontSize: 14,
    fontWeight: '800',
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleActionBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  circleActionIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  moreInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  moreInfoBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  moreInfoIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreInfoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // 2. CONTENT ROWS STYLES
  rowsContainer: {
    paddingLeft: 64, // Perfectly aligns with TopNav & Hero content
    gap: 30,
  },
  rowSection: {
    width: '100%',
  },
  rowHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  rowScrollContent: {
    paddingRight: 64,
    paddingVertical: 10,
    gap: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // 3. PORTRAIT 2:3 MOVIE CARD STYLES (No Empty Side Space, Title Beneath)
  cardWrapper: {
    width: 160,
  },
  posterBox: {
    width: 160,
    height: 240, // Strict 2:3 portrait ratio (160x240)
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0E1626',
    borderWidth: 2.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  posterBoxFocused: {
    borderColor: '#00A8E1',
    transform: [{ scale: 1.05 }],
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    zIndex: 10,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A8E1',
  },
  cardInfoBeneath: {
    width: 160,
    paddingTop: 8,
  },
  cardTitleBeneath: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardTitleFocused: {
    color: '#00A8E1',
  },
  cardMetaBeneath: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },

  // 4. TOP 10 CARD STYLES (Ranking Number to the Left + 2:3 Poster + Title Beneath)
  topTenItemWrapper: {
    width: 206, // 36 (num) + 10 (gap) + 160 (poster)
  },
  topTenRowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  rankNumContainer: {
    width: 36,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    zIndex: 1,
  },
  rankNum: {
    fontSize: 50,
    fontWeight: '900',
    color: '#00A8E1',
    letterSpacing: -1,
  },
  rankNumDoubleDigit: {
    fontSize: 36,
  },
  rankNumFocused: {
    color: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    textShadowColor: '#00A8E1',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  topTenInfoBeneath: {
    paddingLeft: 46, // Aligns text beneath the poster, past the rank number
    width: 206,
    paddingTop: 8,
  },

  // Exit Confirmation Dialog
  exitModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  exitDialogCard: {
    width: 440,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  exitDialogTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  exitDialogSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  exitDialogActions: {
    flexDirection: 'row',
    gap: 16,
  },
  exitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  exitBtnFocused: {
    backgroundColor: '#E50914',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  exitBtnText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
  exitBtnTextFocused: {
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 8,
    backgroundColor: '#00A8E1',
    borderWidth: 1.5,
    borderColor: '#00A8E1',
  },
  cancelBtnFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  cancelBtnText: {
    color: '#040714',
    fontSize: 15,
    fontWeight: '800',
  },
});
