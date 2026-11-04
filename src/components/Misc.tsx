import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors } from '@/theme';
import { Text } from './Text';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.section}>
      <Text size={20} weight="bold" tracking={-0.2} accessibilityRole="header">{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={10} style={styles.seeAll} accessibilityRole="link">
          <Text size={14} weight="semibold" color={colors.indigo}>See all</Text>
          <ArrowRight size={14} color={colors.indigo} />
        </Pressable>
      ) : null}
    </View>
  );
}

// Category chip: navy filled when active, white with border otherwise (44 high, pill)
export function Chip({ label, icon, active, onPress }: { label: string; icon?: ReactNode; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      {icon}
      <Text size={14} weight="bold" color={active ? colors.white : colors.ink}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, color = colors.navy, background = colors.lavender, icon }: { label: string; color?: string; background?: string; icon?: ReactNode }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon}
      <Text size={12} weight="bold" color={color}>{label}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: colors.navy,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 16 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chip: { height: 44, borderRadius: 9999, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipActive: { backgroundColor: colors.navy },
  chipIdle: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
});
