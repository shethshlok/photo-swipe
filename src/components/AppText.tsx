import { Text, TextProps } from 'react-native';

import { FontFamily, Type } from '@/theme/tokens';

type Variant = keyof typeof Type;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  /** Use the rounded system face — great for titles and numerals. */
  rounded?: boolean;
};

/** Text bound to the iOS type ramp with semantic color + Dynamic Type support. */
export function AppText({
  variant = 'body',
  color,
  rounded,
  style,
  maxFontSizeMultiplier = 1.6,
  ...rest
}: Props) {
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        Type[variant],
        { fontFamily: rounded ? FontFamily.rounded : FontFamily.sans },
        color ? { color } : null,
        style,
      ]}
      {...rest}
    />
  );
}
