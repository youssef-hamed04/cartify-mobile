import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { colors } from '@/theme';

export function SummaryRow({ label, value, valueColor = colors.ink, size = 15 }: { label: string; value: string; valueColor?: string; size?: number }) {
  return (
    <View style={styles.row}>
      <Text size={size} color={colors.body}>{label}</Text>
      <Text size={size} weight="bold" color={valueColor} style={styles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  value: { flexShrink: 1, textAlign: 'right' },
});
