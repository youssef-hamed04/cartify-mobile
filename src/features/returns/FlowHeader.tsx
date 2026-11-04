import { StyleSheet, View } from 'react-native';
import { BackButton } from '@/components/Screen';
import { Text } from '@/components/Text';
import { colors } from '@/theme';

const STEPS = 4;

// "Return an item" header + 4-segment progress used by Return steps 1–3 (Figma 27–29)
export function FlowHeader({ step, label, title, subtitle }: { step: number; label: string; title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <BackButton />
        <Text size={20} weight="bold" tracking={-0.2} accessibilityRole="header">Return an item</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={{ gap: 10 }} accessibilityLabel={`Step ${step} of ${STEPS}, ${label}`}>
        <View style={styles.progress}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: i < step ? colors.navy : colors.border }]} />
          ))}
        </View>
        <Text size={13} weight="medium" color={colors.muted}>Step {step} of {STEPS} · {label}</Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text size={28} weight="bold" lineHeight={32} tracking={-0.56}>{title}</Text>
        <Text size={15} color={colors.body} lineHeight={21}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 24, paddingTop: 8, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
