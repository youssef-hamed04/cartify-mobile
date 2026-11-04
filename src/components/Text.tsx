import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts, type FontWeight } from '@/theme';

export interface AppTextProps extends TextProps {
  size?: number;
  weight?: FontWeight;
  color?: string;
  align?: TextStyle['textAlign'];
  lineHeight?: number;
  tracking?: number;
}

// Space Grotesk ships one file per weight, so weight maps to fontFamily (fontWeight breaks on Android).
export function Text({ size = 14, weight = 'regular', color = colors.ink, align, lineHeight, tracking, style, ...rest }: AppTextProps) {
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={1.3}
      style={[{ fontFamily: fonts[weight], fontSize: size, color, textAlign: align, lineHeight, letterSpacing: tracking }, style]}
    />
  );
}
