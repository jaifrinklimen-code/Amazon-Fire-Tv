import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { View, StyleSheet, Text } from 'react-native';
import { SpatialNavigationFocusableView, SpatialNavigationRoot } from 'react-tv-space-navigation';
import { DrawerParamList } from '../navigation/types';
import { useMenuContext } from '../components/MenuContext';
import { useCallback } from 'react';
import { Direction } from '@bam.tech/lrud';
import { getCloseDrawerDirection } from '../utils/rtl';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const navigation = props.navigation;
  const { isOpen: isMenuOpen, toggleMenu } = useMenuContext();
  const activeRouteName = props.state.routes[props.state.index]?.name;

  const drawerItems = [
    { name: 'Home', label: 'Home', icon: '🏠' },
    { name: 'Explore', label: 'Find', icon: '🔍' },
    { name: 'LiveTV', label: 'Live TV', icon: '📺' },
    { name: 'MyList', label: 'My List', icon: '🔖' },
    { name: 'WatchMate', label: 'AI Mate', icon: '✨' },
    { name: 'Settings', label: 'Settings', icon: '⚙️' },
  ] as const;

  const onDirectionHandledWithoutMovement = useCallback(
    (movement: Direction) => {
      if (movement === getCloseDrawerDirection()) {
        navigation.closeDrawer();
        toggleMenu(false);
      }
    },
    [navigation, toggleMenu],
  );

  return (
    <SpatialNavigationRoot isActive={isMenuOpen} onDirectionHandledWithoutMovement={onDirectionHandledWithoutMovement}>
      <View style={drawerStyles.drawerContainer}>
        {/* Brand Icon Header */}
        <View style={drawerStyles.brandHeader}>
          <View style={drawerStyles.logoBadge}>
            <Text style={drawerStyles.logoIcon}>▶</Text>
          </View>
        </View>

        <DrawerContentScrollView
          {...props}
          style={drawerStyles.container}
          scrollEnabled={false}
          contentContainerStyle={drawerStyles.scrollContent}
        >
          {/* Menu Items */}
          <View style={drawerStyles.menuList}>
            {drawerItems.map((item) => {
              const isActive = activeRouteName === item.name;
              return (
                <SpatialNavigationFocusableView
                  key={item.name}
                  onSelect={() => {
                    navigation.jumpTo(item.name as keyof DrawerParamList);
                  }}
                >
                  {({ isFocused }: { isFocused: boolean }) => (
                    <View
                      style={[
                        drawerStyles.menuItem,
                        isActive && drawerStyles.menuItemActive,
                        isFocused && drawerStyles.menuItemFocused,
                      ]}
                    >
                      {isActive && <View style={drawerStyles.activePill} />}
                      <Text style={[drawerStyles.itemIcon, (isFocused || isActive) && drawerStyles.itemIconHighlight]}>
                        {item.icon}
                      </Text>
                      <Text style={[drawerStyles.itemLabel, (isFocused || isActive) && drawerStyles.itemLabelHighlight]}>
                        {item.label}
                      </Text>
                    </View>
                  )}
                </SpatialNavigationFocusableView>
              );
            })}
          </View>
        </DrawerContentScrollView>

        {/* Compact User Profile Avatar */}
        <View style={drawerStyles.profileFooter}>
          <View style={drawerStyles.avatar}>
            <Text style={drawerStyles.avatarText}>J</Text>
          </View>
        </View>
      </View>
    </SpatialNavigationRoot>
  );
}

const drawerStyles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    width: 80,
    backgroundColor: '#070D19',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    paddingVertical: 16,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00A8E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  logoIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 0,
  },
  menuList: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  menuItem: {
    width: 58,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#131F35',
  },
  menuItemFocused: {
    backgroundColor: '#1E2D4A',
    borderColor: '#00A8E1',
    transform: [{ scale: 1.08 }],
  },
  itemIcon: {
    fontSize: 20,
    color: '#A0AEC0',
    marginBottom: 2,
  },
  itemIconHighlight: {
    color: '#00A8E1',
  },
  itemLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#718096',
    letterSpacing: 0.3,
  },
  itemLabelHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activePill: {
    position: 'absolute',
    left: -8,
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#00A8E1',
  },
  profileFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#00A8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#00A8E1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
