import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SpatialNavigationFocusableView } from 'react-tv-space-navigation';
import { useNavigation } from '@react-navigation/native';

interface TopNavigationBarProps {
  activeRoute?: string;
  onSelectCategory?: (cat: string) => void;
}

export default function TopNavigationBar({ activeRoute = 'Home' }: TopNavigationBarProps) {
  const navigation = useNavigation<any>();

  const navLinks = [
    { label: 'Home', route: 'Home' },
    { label: 'Free to Watch', route: 'Explore', category: 'Free' },
    { label: 'Movies', route: 'Explore', category: 'Movies' },
    { label: 'TV Shows', route: 'Explore', category: 'TV Shows' },
    { label: 'Live TV', route: 'LiveTV' },
    { label: 'My List', route: 'MyList' },
    { label: 'WatchMate AI', route: 'WatchMate' },
  ];

  const handleNav = (item: { label: string; route: string; category?: string }) => {
    try {
      if (item.category && item.route === 'Explore') {
        navigation.navigate('Explore', { initialCategory: item.category });
      } else {
        navigation.navigate(item.route);
      }
    } catch {
      navigation.navigate(item.route);
    }
  };

  return (
    <View style={styles.topBarContainer}>
      {/* Brand Logo */}
      <View style={styles.brandGroup}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>▶</Text>
        </View>
        <Text style={styles.brandTitle}>
          CinePilot <Text style={styles.brandHighlight}>AI</Text>
        </Text>
      </View>

      {/* Main Navigation Links */}
      <View style={styles.linksRow}>
        {navLinks.map((link) => {
          const isActive =
            activeRoute.toLowerCase() === link.label.toLowerCase() ||
            activeRoute.toLowerCase() === link.route.toLowerCase();

          return (
            <SpatialNavigationFocusableView
              key={link.label}
              onSelect={() => handleNav(link)}
            >
              {({ isFocused }: { isFocused: boolean }) => (
                <View
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                    isFocused && styles.navItemFocused,
                  ]}
                >
                  <Text
                    style={[
                      styles.navText,
                      isActive && styles.navTextActive,
                      isFocused && styles.navTextFocused,
                    ]}
                  >
                    {link.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </View>
              )}
            </SpatialNavigationFocusableView>
          );
        })}
      </View>

      {/* Right Action Icons: Search & Profile */}
      <View style={styles.rightActionsRow}>
        <SpatialNavigationFocusableView onSelect={() => navigation.navigate('Explore')}>
          {({ isFocused }: { isFocused: boolean }) => (
            <View style={[styles.iconButton, isFocused && styles.iconButtonFocused]}>
              <Text style={styles.iconText}>🔍</Text>
            </View>
          )}
        </SpatialNavigationFocusableView>

        <SpatialNavigationFocusableView onSelect={() => navigation.navigate('Settings')}>
          {({ isFocused }: { isFocused: boolean }) => (
            <View style={[styles.profileAvatar, isFocused && styles.profileAvatarFocused]}>
              <Text style={styles.avatarLetter}>CP</Text>
            </View>
          )}
        </SpatialNavigationFocusableView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 64,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(4, 7, 20, 0.95)',
    zIndex: 100,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#00A8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    color: '#040714',
    fontSize: 14,
    fontWeight: '900',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandHighlight: {
    color: '#00A8E1',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    position: 'relative',
    borderRadius: 4,
  },
  navItemActive: {},
  navItemFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  navText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  navTextFocused: {
    color: '#FFFFFF',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#00A8E1',
    borderRadius: 2,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E1626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  iconButtonFocused: {
    borderColor: '#00A8E1',
    transform: [{ scale: 1.1 }],
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#00A8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  avatarLetter: {
    color: '#00A8E1',
    fontSize: 13,
    fontWeight: '800',
  },
});
