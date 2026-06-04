import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LocationsStackParamList } from './types';
import MesLocationsScreen from '../screens/rentals/MesLocationsScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';
import ReservationScreen from '../screens/rentals/ReservationScreen';
import ChatScreen from '../screens/chat/ChatScreen';

const Stack = createStackNavigator<LocationsStackParamList>();

export default function LocationsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MesLocations" component={MesLocationsScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
