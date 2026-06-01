import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LocationsStackParamList } from './types';
import MesLocationsScreen from '../screens/rentals/MesLocationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';

const Stack = createStackNavigator<LocationsStackParamList>();

export default function LocationsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MesLocations" component={MesLocationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
