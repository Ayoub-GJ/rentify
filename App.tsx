import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
// import { seedItems } from './src/utils/seedFirestore';

SplashScreen.preventAutoHideAsync();
// seedItems(); // ← décommente une seule fois pour peupler Firestore, puis recommente

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
    Inter_400Regular,
    Inter_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </View>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
