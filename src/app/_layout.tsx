import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TrashProvider } from '@/store/trash';
import { Colors } from '@/theme/tokens';

export default function RootLayout() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
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
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
