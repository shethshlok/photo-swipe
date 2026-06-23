import { useColorScheme } from 'react-native';

import { Colors, Palette } from '@/theme/tokens';

/** Returns the active semantic palette, adapting to the system light/dark setting. */
export function useColors(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
