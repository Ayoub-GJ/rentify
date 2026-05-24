import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { Colors } from '../theme/theme';
import HomeStackNavigator from './HomeStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const VISIBLE_TAB_BAR_STYLE = (bottomInset: number) => ({
  backgroundColor: Colors.surface,
  borderTopWidth: 0,
  height: 60 + bottomInset,
  paddingBottom: bottomInset,
  elevation: 20,
  shadowColor: '#1A1A2E',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
});

const HIDDEN_TAB_BAR_STYLE = { display: 'none' } as const;

const Placeholder = () => <View style={{ flex: 1, backgroundColor: Colors.background }} />;

function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.addButton}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_400Regular',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'Home';
          return {
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
            tabBarStyle:
              focusedRoute === 'ItemDetail'
                ? HIDDEN_TAB_BAR_STYLE
                : VISIBLE_TAB_BAR_STYLE(insets.bottom),
          };
        }}
      />
      <Tab.Screen
        name="Search"
        component={Placeholder}
        options={{
          tabBarLabel: 'Recherche',
          tabBarStyle: VISIBLE_TAB_BAR_STYLE(insets.bottom),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddItem"
        component={Placeholder}
        options={{
          tabBarLabel: '',
          tabBarStyle: VISIBLE_TAB_BAR_STYLE(insets.bottom),
          tabBarButton: (props) => (
            <AddButton onPress={() => props.onPress?.({} as any)} />
          ),
        }}
      />
      <Tab.Screen
        name="Locations"
        component={Placeholder}
        options={{
          tabBarLabel: 'Locations',
          tabBarStyle: VISIBLE_TAB_BAR_STYLE(insets.bottom),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Placeholder}
        options={{
          tabBarLabel: 'Profil',
          tabBarStyle: VISIBLE_TAB_BAR_STYLE(insets.bottom),
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
});
