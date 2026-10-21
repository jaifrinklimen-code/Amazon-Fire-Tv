import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  SpatialNavigationRoot,
  SpatialNavigationView,
  SpatialNavigationScrollView,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { useIsFocused } from '@react-navigation/native';
import FocusablePressable from '../components/FocusablePressable';
import TopNavigationBar from '../components/TopNavigationBar';

export default function SettingsScreen() {
  const isFocused = useIsFocused();
  const [selectedQuality, setSelectedQuality] = useState('4K UHD');
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [audioLang, setAudioLang] = useState('English (Original)');

  const qualityOptions = ['Auto', '4K UHD', '1080p Full HD', 'Data Saver'];

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        <TopNavigationBar activeRoute="Profile" />

        <SpatialNavigationScrollView
          useNativeScroll={true}
          offsetFromStart={20}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>CP</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>CinePilot Member</Text>
              <Text style={styles.profileEmail}>cinepilot.member@firetv.local</Text>
              <View style={styles.subPill}>
                <Text style={styles.subPillText}>CinePilot Prime Pass • Active</Text>
              </View>
            </View>
          </View>

          {/* Streaming Quality */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Streaming Video Quality</Text>
            <SpatialNavigationView direction="horizontal">
              <View style={styles.optionsRow}>
                {qualityOptions.map((quality, index) =>
                  index === 0 ? (
                    <DefaultFocus key={quality}>
                      <FocusablePressable
                        text={quality}
                        onSelect={() => setSelectedQuality(quality)}
                        style={[
                          styles.optionButton,
                          selectedQuality === quality && styles.selectedOption,
                        ]}
                      />
                    </DefaultFocus>
                  ) : (
                    <FocusablePressable
                      key={quality}
                      text={quality}
                      onSelect={() => setSelectedQuality(quality)}
                      style={[
                        styles.optionButton,
                        selectedQuality === quality && styles.selectedOption,
                      ]}
                    />
                  ),
                )}
              </View>
            </SpatialNavigationView>
          </View>

          {/* Playback Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Playback Preferences</Text>
            <SpatialNavigationView direction="vertical">
              <View style={styles.optionsColumn}>
                <FocusablePressable
                  text={`Autoplay Next Episode: ${autoplay ? 'Enabled' : 'Disabled'}`}
                  onSelect={() => setAutoplay(!autoplay)}
                  style={styles.toggleButton}
                />
                <FocusablePressable
                  text={`New Release Notifications: ${notifications ? 'Enabled' : 'Disabled'}`}
                  onSelect={() => setNotifications(!notifications)}
                  style={styles.toggleButton}
                />
                <FocusablePressable
                  text={`Default Audio: ${audioLang}`}
                  onSelect={() =>
                    setAudioLang(
                      audioLang.includes('English') ? 'Spanish' : audioLang.includes('Spanish') ? 'Hindi' : 'English (Original)',
                    )
                  }
                  style={styles.toggleButton}
                />
              </View>
            </SpatialNavigationView>
          </View>

          {/* Application Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Application</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Platform</Text>
                <Text style={styles.infoValue}>Amazon Fire TV (React Native TV)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>App Version</Text>
                <Text style={styles.infoValue}>2.4.0 (Prime UI Edition)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Display Resolution</Text>
                <Text style={styles.infoValue}>1920 × 1080 (Full HD Baseline)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>AI Recommendation Engine</Text>
                <Text style={styles.infoValue}>WatchMate v2 (On-Device Neural)</Text>
              </View>
            </View>
          </View>
        </SpatialNavigationScrollView>
      </View>
    </SpatialNavigationRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040714',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 48,
    paddingTop: 24,
    paddingBottom: 80,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 36,
    padding: 24,
    backgroundColor: '#0E1626',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#131F35',
    borderWidth: 2,
    borderColor: '#00A8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#00A8E1',
    fontSize: 24,
    fontWeight: '900',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  subPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 168, 225, 0.15)',
    borderColor: '#00A8E1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subPillText: {
    color: '#00A8E1',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  optionsColumn: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0E1626',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 168, 225, 0.2)',
    borderColor: '#00A8E1',
  },
  toggleButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#0E1626',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    maxWidth: 500,
  },
  infoCard: {
    backgroundColor: '#0E1626',
    borderRadius: 12,
    padding: 20,
    maxWidth: 600,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
