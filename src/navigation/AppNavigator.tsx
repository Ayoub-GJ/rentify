import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.config';
import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

export default function AppNavigator() {
  const [splashDone, setSplashDone] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth check runs in background, independently of splash timing
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // Splash always plays its full 2.6s animation
  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  // Splash done — auth resolves before 2.6s in practice (AsyncStorage cache),
  // but wait for it in the rare case it hasn't yet
  if (!authChecked) {
    return null;
  }

  if (user) {
    return <MainTabNavigator />;
  }

  return <AuthNavigator />;
}
