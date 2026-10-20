import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerParamList } from './types';

// Import all screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import TVScreen from '../screens/TVScreen';
import MyListScreen from '../screens/MyListScreen';
import WatchMateScreen from '../screens/WatchMateScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator<DrawerParamList>();

// Horizontal TopNavigationBar handles navigation - no narrow left drawer
const NullDrawer = () => null;

export default function DrawerNavigator() {
  const navigationContent = (
    <Drawer.Navigator
      drawerContent={NullDrawer}
      initialRouteName="Home"
      defaultStatus="closed"
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 0, display: 'none' },
        drawerType: 'back',
        swipeEnabled: false,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Explore" component={ExploreScreen} />
      <Drawer.Screen name="LiveTV" component={TVScreen} />
      <Drawer.Screen name="MyList" component={MyListScreen} />
      <Drawer.Screen name="WatchMate" component={WatchMateScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );

  if (Platform.isTV) {
    return <View style={styles.container}>{navigationContent}</View>;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {navigationContent}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040714',
  },
});
