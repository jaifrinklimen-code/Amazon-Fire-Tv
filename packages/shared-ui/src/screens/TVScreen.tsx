import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Image, Platform } from 'react-native';
import {
  SpatialNavigationRoot,
  SpatialNavigationFocusableView,
  SpatialNavigationScrollView,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import TopNavigationBar from '../components/TopNavigationBar';
import PlatformLinearGradient from '../components/PlatformLinearGradient';

type TVScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'DrawerNavigator'>;

export interface LiveChannel {
  id: string;
  number: string;
  name: string;
  category: string;
  currentShow: string;
  timeSlot: string;
  synopsis: string;
  nextShow: string;
  badgeBg: string;
  streamUrl: string;
  previewUrl: string;
  elapsedPercent: string;
}

export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'ch-bloomberg',
    number: '01',
    name: 'Bloomberg TV',
    category: 'News',
    currentShow: 'Bloomberg Surveillance & Global Markets',
    timeSlot: '14:00 - 15:00',
    synopsis: 'Live global market coverage, economic policy developments, real-time index tracking, and in-depth Wall Street analyst interviews.',
    nextShow: 'Balance of Power (15:00)',
    badgeBg: '#1B2A4A',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '65%',
  },
  {
    id: 'ch-euronews',
    number: '02',
    name: 'Euronews English',
    category: 'News',
    currentShow: 'Euronews Global Live & European Parliament Update',
    timeSlot: '14:15 - 14:45',
    synopsis: 'Comprehensive pan-European news coverage, international affairs, climate developments, and cross-border European reporting.',
    nextShow: 'Euronews Now (14:45)',
    badgeBg: '#0A3B7B',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '40%',
  },
  {
    id: 'ch-france24',
    number: '03',
    name: 'France 24 English',
    category: 'News',
    currentShow: 'Live World News & Paris Dispatch',
    timeSlot: '14:00 - 14:30',
    synopsis: 'French international news network broadcasting worldwide perspectives, African affairs, diplomatic reports, and culture.',
    nextShow: 'Perspective: Global Interviews (14:30)',
    badgeBg: '#1E3A8A',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '50%',
  },
  {
    id: 'ch-nasa',
    number: '04',
    name: 'NASA TV Live',
    category: 'Science',
    currentShow: 'ISS Live Views of Earth & Artemis Mission Briefing',
    timeSlot: '13:30 - 15:30',
    synopsis: 'Real-time high-definition views of Earth from the International Space Station, spacewalk archives, and deep-space science broadcasts.',
    nextShow: 'Space Station Science Briefing (15:30)',
    badgeBg: '#0B1C3D',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '75%',
  },
  {
    id: 'ch-redbull',
    number: '05',
    name: 'Red Bull TV',
    category: 'Sports',
    currentShow: 'Cliff Diving World Series & Motocross Championships',
    timeSlot: '14:00 - 16:00',
    synopsis: 'High-adrenaline action sports, live global racing competitions, extreme snowboarding, BMX showcases, and outdoor adventure films.',
    nextShow: 'Crankworx Mountain Bike World Tour (16:00)',
    badgeBg: '#7F1D1D',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '30%',
  },
  {
    id: 'ch-dw',
    number: '06',
    name: 'DW English',
    category: 'News',
    currentShow: 'DW News: In-Depth Global Analysis & Documentaries',
    timeSlot: '14:30 - 15:00',
    synopsis: 'Germany\'s international public broadcaster presenting impartial worldwide journalism, geopolitical documentaries, and European science.',
    nextShow: 'The Day: European Focus (15:00)',
    badgeBg: '#134E4A',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '20%',
  },
  {
    id: 'ch-aljazeera',
    number: '07',
    name: 'Al Jazeera English',
    category: 'News',
    currentShow: 'NewsHour & International Field Investigations',
    timeSlot: '14:00 - 15:00',
    synopsis: 'Comprehensive field reporting from unrepresented regions across the Middle East, Global South, Asia, and international organizations.',
    nextShow: 'Counting the Cost (15:00)',
    badgeBg: '#78350F',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '55%',
  },
  {
    id: 'ch-pbs',
    number: '08',
    name: 'PBS America / Frontline',
    category: 'Documentary',
    currentShow: 'Frontline: Investigative Journalism Special',
    timeSlot: '13:30 - 15:00',
    synopsis: 'Peabody and Emmy award-winning investigative journalism delving into world politics, environmental science, and society.',
    nextShow: 'Nova: Deep Space Telescopes (15:00)',
    badgeBg: '#1E293B',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1280&q=80',
    elapsedPercent: '80%',
  },
];

const TABS = ['All Channels', 'News', 'Sports', 'Science', 'Documentary'];

export default function TVScreen() {
  const navigation = useNavigation<TVScreenNavProp>();
  const isFocused = useIsFocused();
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel>(LIVE_CHANNELS[0]);
  const [activeTab, setActiveTab] = useState('All Channels');

  const filteredChannels =
    activeTab === 'All Channels'
      ? LIVE_CHANNELS
      : LIVE_CHANNELS.filter((c) => c.category.toLowerCase() === activeTab.toLowerCase());

  const watchChannel = useCallback(
    (channel: LiveChannel) => {
      navigation.navigate('Player', {
        id: channel.id,
        title: channel.name + ': ' + channel.currentShow,
        movie: channel.streamUrl,
        headerImage: channel.previewUrl,
      });
    },
    [navigation],
  );

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        <TopNavigationBar activeRoute="Live TV" />

        <View style={styles.mainLayout}>
          {/* Left Column: Filter Tabs & Channel Guide List */}
          <View style={styles.guideColumn}>
            {/* Guide Title & Filter Tabs */}
            <View style={styles.guideHeader}>
              <View style={styles.liveBadgeRow}>
                <View style={styles.redDot} />
                <Text style={styles.liveGuideTitle}>Live TV Guide</Text>
                <Text style={styles.channelCount}>({LIVE_CHANNELS.length} verified streams)</Text>
              </View>

              <View style={styles.tabRow}>
                {TABS.map((tab) => {
                  const isSelected = activeTab === tab;
                  return (
                    <SpatialNavigationFocusableView
                      key={tab}
                      onSelect={() => setActiveTab(tab)}
                    >
                      {({ isFocused: focused }: { isFocused: boolean }) => (
                        <View
                          style={[
                            styles.tabPill,
                            isSelected && styles.tabPillSelected,
                            focused && styles.tabPillFocused,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tabPillText,
                              isSelected && styles.tabPillTextSelected,
                              focused && styles.tabPillTextFocused,
                            ]}
                          >
                            {tab}
                          </Text>
                        </View>
                      )}
                    </SpatialNavigationFocusableView>
                  );
                })}
              </View>
            </View>

            {/* Channels Scrollable List */}
            <SpatialNavigationScrollView
              useNativeScroll={true}
              offsetFromStart={20}
              style={styles.channelListScroll}
              contentContainerStyle={styles.channelListContent}
            >
              {filteredChannels.map((channel) => {
                const isSelected = selectedChannel.id === channel.id;
                return (
                  <SpatialNavigationFocusableView
                    key={channel.id}
                    onSelect={() => watchChannel(channel)}
                  >
                    {({ isFocused: focused }: { isFocused: boolean }) => {
                      if (focused && selectedChannel.id !== channel.id) {
                        setSelectedChannel(channel);
                      }
                      return (
                        <View
                          style={[
                            styles.channelRow,
                            isSelected && styles.channelRowSelected,
                            focused && styles.channelRowFocused,
                          ]}
                        >
                          {/* Channel Badge / Logo */}
                          <View style={[styles.channelBadge, { backgroundColor: channel.badgeBg }]}>
                            <Text style={styles.channelNum}>{channel.number}</Text>
                            <Text style={styles.channelBadgeName} numberOfLines={1}>
                              {channel.name.split(' ')[0]}
                            </Text>
                          </View>

                          {/* Channel Info & Schedule */}
                          <View style={styles.channelDetails}>
                            <View style={styles.channelTitleRow}>
                              <Text style={styles.channelName}>{channel.name}</Text>
                              <View style={styles.liveTag}>
                                <Text style={styles.liveTagText}>● LIVE</Text>
                              </View>
                            </View>

                            <Text style={styles.currentShowTitle} numberOfLines={1}>
                              {channel.currentShow}
                            </Text>

                            <View style={styles.timeSlotRow}>
                              <Text style={styles.timeSlotText}>{channel.timeSlot}</Text>
                              <View style={styles.elapsedTrack}>
                                <View
                                  style={[
                                    styles.elapsedFill,
                                    { width: channel.elapsedPercent as any },
                                  ]}
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    }}
                  </SpatialNavigationFocusableView>
                );
              })}
            </SpatialNavigationScrollView>
          </View>

          {/* Right Column: Live Channel Preview & Action Hub */}
          <View style={styles.previewColumn}>
            <View style={styles.previewCard}>
              <Image
                source={{ uri: selectedChannel.previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <PlatformLinearGradient
                colors={['transparent', 'rgba(4,7,20,0.7)', 'rgba(4,7,20,0.98)']}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 0, y: 1 }}
                style={styles.previewGradient}
              />

              <View style={styles.previewContent}>
                <View style={styles.previewLiveRow}>
                  <View style={styles.previewLivePill}>
                    <Text style={styles.previewLivePillText}>● BROADCASTING LIVE</Text>
                  </View>
                  <Text style={styles.previewCategory}>{selectedChannel.category.toUpperCase()}</Text>
                </View>

                <Text style={styles.previewChannelName}>{selectedChannel.name}</Text>
                <Text style={styles.previewShowTitle}>{selectedChannel.currentShow}</Text>
                <Text style={styles.previewTime}>{selectedChannel.timeSlot}</Text>

                <Text style={styles.previewSynopsis} numberOfLines={3}>
                  {selectedChannel.synopsis}
                </Text>

                <View style={styles.nextUpBox}>
                  <Text style={styles.nextUpLabel}>UP NEXT</Text>
                  <Text style={styles.nextUpTitle} numberOfLines={1}>
                    {selectedChannel.nextShow}
                  </Text>
                </View>

                <DefaultFocus>
                  <SpatialNavigationFocusableView onSelect={() => watchChannel(selectedChannel)}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.watchLiveBtn, focused && styles.watchLiveBtnFocused]}>
                        <Text style={styles.watchLiveIcon}>▶</Text>
                        <Text style={styles.watchLiveText}>Watch Live Stream</Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                </DefaultFocus>
              </View>
            </View>
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
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 32,
  },
  guideColumn: {
    flex: 1.1,
    display: 'flex',
    flexDirection: 'column',
  },
  guideHeader: {
    marginBottom: 16,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  liveGuideTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  channelCount: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  tabPillSelected: {
    backgroundColor: 'rgba(0, 168, 225, 0.2)',
    borderColor: '#00A8E1',
  },
  tabPillFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  tabPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabPillTextSelected: {
    color: '#00A8E1',
    fontWeight: '700',
  },
  tabPillTextFocused: {
    color: '#FFFFFF',
  },
  channelListScroll: {
    flex: 1,
  },
  channelListContent: {
    paddingRight: 12,
    gap: 12,
  },
  channelRow: {
    flexDirection: 'row',
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 16,
  },
  channelRowSelected: {
    borderColor: '#00A8E1',
    backgroundColor: '#131F37',
  },
  channelRowFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.02 }],
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  channelBadge: {
    width: 60,
    height: 54,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  channelNum: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  channelBadgeName: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  channelDetails: {
    flex: 1,
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveTagText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  currentShowTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeSlotText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  elapsedTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  elapsedFill: {
    height: '100%',
    backgroundColor: '#00A8E1',
  },
  previewColumn: {
    flex: 0.9,
    justifyContent: 'flex-start',
  },
  previewCard: {
    height: 480,
    backgroundColor: '#0E1626',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  previewGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  previewContent: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
  },
  previewLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  previewLivePill: {
    backgroundColor: '#EF4444',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  previewLivePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  previewCategory: {
    color: '#00A8E1',
    fontSize: 12,
    fontWeight: '700',
  },
  previewChannelName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  previewShowTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewTime: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 12,
  },
  previewSynopsis: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  nextUpBox: {
    backgroundColor: 'rgba(14, 22, 38, 0.75)',
    borderLeftWidth: 3,
    borderLeftColor: '#00A8E1',
    padding: 8,
    borderRadius: 4,
    marginBottom: 18,
  },
  nextUpLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  nextUpTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  watchLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A8E1',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  watchLiveBtnFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.03 }],
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  watchLiveIcon: {
    color: '#040714',
    fontSize: 16,
    fontWeight: 'bold',
  },
  watchLiveText: {
    color: '#040714',
    fontSize: 15,
    fontWeight: '800',
  },
});
