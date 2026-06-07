import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MesFavorisScreen from '../screens/profile/MesFavorisScreen';
import MesAvisScreen from '../screens/profile/MesAvisScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MesFavoris" component={MesFavorisScreen} />
      <Stack.Screen name="MesAvis" component={MesAvisScreen} />
    </Stack.Navigator>
  );
}
