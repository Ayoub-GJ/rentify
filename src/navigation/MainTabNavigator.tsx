import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { Colors } from '../theme/theme';
import HomeStackNavigator from './HomeStackNavigator';
import LocationsStackNavigator from './LocationsStackNavigator';
import AddItemScreen from '../screens/items/AddItemScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const Placeholder = () => <View style={{ flex: 1, backgroundColor: Colors.background }} />;

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    height: 60 + insets.bottom,
    paddingBottom: insets.bottom,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'Home';
          const hideTabBar = focusedRoute === 'ItemDetail' || focusedRoute === 'Reservation';
          return {
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
            ...(hideTabBar && { tabBarStyle: { display: 'none' } }),
          };
        }}
      />
      <Tab.Screen
        name="Search"
        component={Placeholder}
        options={{
          tabBarLabel: 'Recherche',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{
          tabBarLabel: () => null,
          tabBarShowLabel: false,
          tabBarStyle: { display: 'none' },
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <Ionicons name="add" size={30} color="white" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Locations"
        component={LocationsStackNavigator}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'MesLocations';
          const hideTabBar = focusedRoute === 'Chat';
          return {
            tabBarLabel: 'Locations',
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
            ),
            ...(hideTabBar && { tabBarStyle: { display: 'none' } }),
          };
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Placeholder}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
