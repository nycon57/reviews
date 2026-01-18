import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen, ReviewsScreen, SettingsScreen } from '../screens/main';
import { VideoNavigator } from './VideoNavigator';
import { Colors } from '../constants/colors';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName =
  | 'home'
  | 'home-outline'
  | 'star'
  | 'star-outline'
  | 'videocam'
  | 'videocam-outline'
  | 'settings'
  | 'settings-outline';

export function TabNavigator() {
  const colors = Colors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: TabIconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Reviews':
              iconName = focused ? 'star' : 'star-outline';
              break;
            case 'Videos':
              iconName = focused ? 'videocam' : 'videocam-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: 'Reviews' }}
      />
      <Tab.Screen
        name="Videos"
        component={VideoNavigator}
        options={{ title: 'Videos' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
