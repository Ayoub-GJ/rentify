import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SearchStackParamList } from './types';
import SearchScreen from '../screens/search/SearchScreen';
import MapScreen from '../screens/search/MapScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';
import ReservationScreen from '../screens/rentals/ReservationScreen';
import ChatScreen from '../screens/chat/ChatScreen';

const Stack = createStackNavigator<SearchStackParamList>();

export default function SearchStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="MapScreen" component={MapScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
