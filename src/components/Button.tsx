import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'outline' | 'light' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode; // rendered after the label, as in the design
  leftIcon?: ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.navy, fg: colors.white },
  outline: { bg: colors.white, fg: colors.navy, border: colors.border },
  light: { bg: colors.white, fg: colors.navy },
  danger: { bg: colors.white, fg: colors.danger, border: colors.border },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, leftIcon, height = 58, style }: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { height, backgroundColor: p.bg, borderColor: p.border ?? p.bg, borderWidth: p.border ? 1.5 : 0 },
        variant === 'primary' && !inactive && shadows.button,
        inactive && { opacity: 0.55 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {leftIcon}
          <Text weight="bold" size={height >= 56 ? 18 : 15} color={p.fg}>{title}</Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  onPress?: () => void;
  children: ReactNode;
  size?: number;
  background?: string;
  label: string;
  style?: StyleProp<ViewStyle>;
  bordered?: boolean;
}

export function IconButton({ onPress, children, size = 44, background = colors.white, label, style, bordered }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, alignItems: 'center', justifyContent: 'center' },
        bordered && { borderWidth: 1, borderColor: colors.border },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
