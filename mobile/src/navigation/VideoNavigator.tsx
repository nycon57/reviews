import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  VideoTestimonialsScreen,
  VideoDetailScreen,
  CreateRequestScreen,
} from '../screens/videos';
import type { VideoStackParamList } from '../types';

const Stack = createNativeStackNavigator<VideoStackParamList>();

export function VideoNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="VideoList" component={VideoTestimonialsScreen} />
      <Stack.Screen
        name="VideoDetail"
        component={VideoDetailScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
