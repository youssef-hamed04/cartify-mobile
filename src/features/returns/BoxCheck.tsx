import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ScanSearch, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import type { ReturnRequest } from '@/api';
import { Text } from '@/components/Text';
import { colors } from '@/theme';

// Customer-facing summary of the SmartBox drop-off check. Scores stay on the admin side;
// the customer only sees whether the item was recognised or needs a manual look.
export function BoxCheck({ rr }: { rr: ReturnRequest }) {
  const v = rr.verification;
  if (!v) return null;

  const state = {
    processing: { bg: colors.lavender, fg: colors.navy, title: 'Checking your item…', text: 'The SmartBox is checking the photo and weight of your item.' },
    match: { bg: colors.successBg, fg: colors.success, title: 'Item verified by the SmartBox', text: 'The photo and weight match the product you returned.' },
    review: { bg: colors.warningBg, fg: colors.warning, title: 'Item sent for manual review', text: 'The automatic check wasn’t sure, so our team will look at it.' },
    error: { bg: colors.warningBg, fg: colors.warning, title: 'Item sent for manual review', text: 'The automatic check didn’t finish, so our team will look at it.' },
  }[v.verdict];

  const Icon = v.verdict === 'match' ? ShieldCheck : v.verdict === 'processing' ? ScanSearch : TriangleAlert;
  const w = v.weight;

  return (
    <View style={[styles.card, { backgroundColor: state.bg }]} accessibilityRole="summary">
      <View style={[styles.icon, { backgroundColor: colors.white }]}>
        {v.verdict === 'processing' ? <ActivityIndicator color={colors.navy} /> : <Icon size={22} color={state.fg} />}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text size={15} weight="bold" color={colors.ink}>{state.title}</Text>
        <Text size={13} color={colors.body} lineHeight={18}>{state.text}</Text>
        {w?.measured != null ? (
          <Text size={12} weight="semibold" color={state.fg}>Weighed in the box: {w.measured} g</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 24, padding: 16, marginTop: 16 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
