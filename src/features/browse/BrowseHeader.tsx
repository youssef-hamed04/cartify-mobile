import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { IconButton } from '@/components/Button';
import { goBack } from '@/components/Screen';
import { Text } from '@/components/Text';
import { colors } from '@/theme';

// Header used by Categories / Shop / Wishlist: 46px round buttons, 22px bold title, optional subtitle
export function BrowseHeader({ title, subtitle, right, back = true }: { title: string; subtitle?: string; right?: ReactNode; back?: boolean }) {
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton label="Go back" onPress={goBack} size={46} bordered>
          <ChevronLeft size={22} color={colors.ink} />
        </IconButton>
      ) : <View style={styles.spacer} />}
      <View style={styles.title}>
        <Text size={22} weight="bold" tracking={-0.22} numberOfLines={1} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text size={13} color={colors.muted}>{subtitle}</Text> : null}
      </View>
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

export function HeaderButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <IconButton label={label} onPress={onPress} size={46} bordered>
      {children}
    </IconButton>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, gap: 12 },
  title: { flex: 1, alignItems: 'center' },
  spacer: { width: 46 },
});
