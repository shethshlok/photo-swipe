import { BlurView } from 'expo-blur';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useColors } from '@/theme/useColors';

/**
 * Frosted "material" surface for the floating action bars, built on the native
 * UIVisualEffectView (expo-blur). Compiles on any recent Xcode and reads as a
 * premium iOS surface in both light and dark mode. Layout styles (flex / padding /
 * radius) are forwarded to the blur view so it behaves like a normal container.
 */
export function GlassBar({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Accepted for call-site compatibility; not needed by the blur material. */
  tintColor?: string;
}) {
  const c = useColors();
  return (
    <BlurView
      intensity={60}
      tint={c.scheme === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
      style={[{ borderWidth: 0.5, borderColor: c.separator }, style]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: c.scheme === 'dark' ? 'rgba(28,28,30,0.3)' : 'rgba(255,255,255,0.22)' },
        ]}
      />
      {children}
    </BlurView>
  );
}
