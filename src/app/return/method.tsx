import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Box, Info, Truck } from 'lucide-react-native';
import { errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Misc';
import { Screen, StickyFooter } from '@/components/Screen';
import { Text } from '@/components/Text';
import { FlowHeader } from '@/features/returns/FlowHeader';
import { useReturnDraft } from '@/features/returns/draft';
import { useCreateReturn } from '@/hooks/queries';
import { useToast } from '@/providers/ToastProvider';
import { colors } from '@/theme';

// Figma 29 · Return 3 · Method
export default function MethodScreen() {
  const draft = useReturnDraft();
  const createReturn = useCreateReturn();
  const toast = useToast();

  // Opened without a complete draft (deep link / reload): restart the flow
  useEffect(() => {
    if (!createReturn.isSuccess && (!draft.items.length || !draft.reason || !draft.orderId)) router.replace('/return/select');
  }, [draft.items.length, draft.reason, draft.orderId, createReturn.isSuccess]);

  const submit = () => {
    if (!draft.orderId || !draft.reason || !draft.items.length) return;
    createReturn.mutate(
      {
        orderId: draft.orderId,
        reason: draft.reason,
        notes: draft.notes.trim() || undefined,
        items: draft.items.map(({ productId, name, color, quantity }) => ({ productId, name, color, quantity })),
      },
      {
        onSuccess: (rr) => {
          // Drop select/reason/method from history so "back" on the code screen leaves the flow.
          // The draft unmounts with the flow layout, so it is not reset here (that would re-trigger the guards).
          router.dismissAll();
          router.replace(`/return/${rr._id}`);
        },
        onError: (e) => toast.show(errorMessage(e), 'error'),
      },
    );
  };

  return (
    <Screen
      footer={
        <StickyFooter>
          <Button
            title="Get my return code"
            loading={createReturn.isPending}
            icon={<ArrowRight size={20} color={colors.white} />}
            onPress={submit}
          />
        </StickyFooter>
      }
    >
      <FlowHeader step={3} label="Return method" title={'How do you want\nto return it?'} subtitle="SmartBox is the fastest, no packaging needed." />
      <View style={{ gap: 16 }} accessibilityRole="radiogroup">
        <View style={[styles.method, styles.methodActive]} accessibilityRole="radio" accessibilityState={{ checked: true }}>
          <View style={[styles.icon, { backgroundColor: colors.navy }]}><Box size={26} color={colors.white} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Text size={17} weight="bold">SmartBox drop-off</Text>
              <View style={styles.best}><Text size={10} weight="bold" color={colors.white} tracking={0.4}>BEST</Text></View>
            </View>
            <Text size={14} color={colors.body} lineHeight={19}>Free · Open 24/7 · No packaging</Text>
          </View>
        </View>
        <View style={[styles.method, { opacity: 0.6 }]} accessibilityRole="radio" accessibilityState={{ checked: false, disabled: true }}>
          <View style={[styles.icon, { backgroundColor: colors.lavender }]}><Truck size={26} color={colors.navy} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text size={17} weight="bold">Courier pickup</Text>
            <Text size={14} color={colors.body} lineHeight={19}>Not available yet</Text>
          </View>
          <Pill label="Coming soon" />
        </View>
      </View>
      <View style={styles.note}>
        <Info size={22} color={colors.indigo} />
        <Text size={14} color={colors.body} lineHeight={19} style={{ flex: 1 }}>
          Your return code is valid for 48 hours. Once the SmartBox receives the item, our team reviews it and processes your refund.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  method: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 28, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  methodActive: { backgroundColor: colors.lavender, borderWidth: 2, borderColor: colors.indigo, padding: 17 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  best: { backgroundColor: colors.indigo, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  note: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
});
