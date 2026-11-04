import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, heroGradient } from '@/theme';

// Navy→indigo hero with the two soft "glow" circles used across auth, returns and code screens
export function GradientHero({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient {...heroGradient} style={[styles.hero, style]}>
      <View pointerEvents="none" style={[styles.glow, { width: 300, height: 300, right: -130, top: -90, backgroundColor: colors.indigo, opacity: 0.85 }]} />
      <View pointerEvents="none" style={[styles.glow, { width: 240, height: 240, left: -120, bottom: -150, backgroundColor: colors.periwinkle, opacity: 0.9 }]} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  glow: { position: 'absolute', borderRadius: 9999 },
});
