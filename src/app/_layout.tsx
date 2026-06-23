import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ensureCleanupReminder } from '@/lib/notifications';
import { StatsProvider } from '@/store/stats';
import { TrashProvider } from '@/store/trash';
import { Colors } from '@/theme/tokens';

export default function RootLayout() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? Colors.dark : Colors.light;

  // Make sure the monthly "tidy up your gallery" reminder is scheduled.
  useEffect(() => {
    ensureCleanupReminder();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatsProvider>
          <TrashProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.bg },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="swipe" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen
                name="trash"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
            <StatusBar style="auto" />
          </TrashProvider>
          </StatsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
