import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import firebaseAuth from '@react-native-firebase/auth';
import { useStore, AppUser, LOCAL_USER } from '@/store/useStore';
import { healthCheck } from '@/services/api';
import { Colors } from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadFromStorage, darkMode, setUser, addDebugLog, setServerStatus } = useStore();
  const hasSeenOnboarding = useStore((s) => s.hasSeenOnboarding);
  const [authUser, setAuthUser] = useState<AppUser | null | undefined>(undefined);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const firebaseAvailable = useRef(true);
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  // Storage + first server ping
  useEffect(() => {
    addDebugLog('App start — loading storage');
    loadFromStorage().then(() => {
      setStorageLoaded(true);
      const { apiUrl } = useStore.getState();
      if (!apiUrl) return;
      setServerStatus('checking');
      healthCheck(apiUrl).then((ok) => setServerStatus(ok ? 'ready' : 'offline'));
    });
  }, []);

  // Theme the native window background so there's no white flash
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(darkMode ? Colors.dark.background : Colors.light.background).catch(() => {});
  }, [darkMode]);

  // Firebase auth listener — degrades to a local user if the native module or
  // google-services.json isn't present.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    const timeout = setTimeout(() => {
      setAuthUser((current) => {
        if (current === undefined) {
          addDebugLog('Auth never resolved in 5s — continuing as local demo user');
          firebaseAvailable.current = false;
          setUser(LOCAL_USER);
          return LOCAL_USER;
        }
        return current;
      });
    }, 5000);

    try {
      unsub = firebaseAuth().onAuthStateChanged((u: any) => {
        clearTimeout(timeout);
        if (u) {
          const mapped: AppUser = {
            uid: u.uid,
            name: u.displayName,
            email: u.email,
            photo: u.photoURL,
            isGuest: !!u.isAnonymous,
          };
          setAuthUser(mapped);
          setUser(mapped);
        } else {
          setAuthUser(null);
          setUser(null);
        }
      });
    } catch (e: any) {
      clearTimeout(timeout);
      addDebugLog(`Firebase unavailable (${e?.message ?? e}) — local demo mode`);
      firebaseAvailable.current = false;
      setAuthUser(LOCAL_USER);
      setUser(LOCAL_USER);
    }

    return () => {
      unsub?.();
      clearTimeout(timeout);
    };
  }, []);

  // Routing guard
  useEffect(() => {
    if (!navState?.key || authUser === undefined || !storageLoaded) return;
    SplashScreen.hideAsync();

    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';

    if (!authUser) {
      if (!inLogin) router.replace('/login');
      return;
    }
    if (!hasSeenOnboarding) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }
    if (inLogin || inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [authUser, segments, navState?.key, storageLoaded, hasSeenOnboarding]);

  const theme = darkMode ? Colors.dark : Colors.light;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="result"
          options={{
            headerShown: true,
            title: 'Prediction',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
        <Stack.Screen
          name="condition"
          options={{
            headerShown: true,
            title: 'Finding',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
