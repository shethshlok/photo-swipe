import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleProp, ViewStyle } from 'react-native';

import { cardShadow } from '@/theme/tokens';
import { useColors } from '@/theme/useColors';

type Props = {
  name: SFSymbol;
  onPress?: () => void;
  size?: number; // diameter of the circle
  iconSize?: number;
  color?: string; // icon tint
  background?: string;
  bordered?: boolean;
  disabled?: boolean;
  shadow?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A round, tappable SF Symbol button with a gentle press-down response. */
export function IconButton({
  name,
  onPress,
  size = 56,
  iconSize,
  color,
  background,
  bordered,
  disabled,
  shadow,
  accessibilityLabel,
  style,
}: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background ?? c.card,
          borderWidth: bordered ? 0.5 : 0,
          borderColor: c.separator,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
        shadow ? cardShadow(c.shadow) : null,
        style,
      ]}
    >
      <SymbolView
        name={name}
        size={iconSize ?? size * 0.42}
        tintColor={color ?? c.text}
        type="monochrome"
        resizeMode="scaleAspectFit"
      />
    </Pressable>
  );
}
