import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ShoppingCart, Star, Zap } from 'lucide-react-native';
import { colors } from '@/theme';
import { Text } from './Text';

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.31 }]}>
      <ShoppingCart size={size * 0.5} color={colors.navy} strokeWidth={2} />
    </View>
  );
}

// Tilted floating badges ("INSTANT!", "BEST CHOICE") from the splash/auth heroes
export function FloatingBadge({ label, variant = 'white', rotate = 0, style }: {
  label: string;
  variant?: 'white' | 'periwinkle';
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const Icon = variant === 'white' ? Zap : Star;
  return (
    <View
      pointerEvents="none"
      style={[styles.badge, { backgroundColor: variant === 'white' ? colors.white : colors.periwinkle, transform: [{ rotate: `${rotate}deg` }] }, style]}
    >
      <Icon size={16} color={colors.navy} />
      <Text size={12} weight="bold" color={colors.navy} tracking={0.96}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: colors.navy,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
});
