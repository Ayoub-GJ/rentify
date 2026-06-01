import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SearchStackParamList } from './types';
import SearchScreen from '../screens/search/SearchScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';
import ReservationScreen from '../screens/rentals/ReservationScreen';

const Stack = createStackNavigator<SearchStackParamList>();

export default function SearchStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} />
    </Stack.Navigator>
  );
}
