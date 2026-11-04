import { useCallback } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Divider } from '@/components/Misc';
import { Screen, StickyFooter } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { useOrder } from '@/hooks/queries';
import { money, shortDate } from '@/lib/format';
import { colors } from '@/theme';

const PAYMENT_LABEL = { cash: 'Cash on delivery', credit_card: 'Card', instaPay: 'InstaPay', vodafoneCash: 'Vodafone Cash' } as const;

export default function OrderConfirmedScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const order = useOrder(id);
  const goHome = useCallback(() => router.replace('/'), []);

  // Android back returns to the shop instead of the (now empty) checkout
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => { goHome(); return true; });
      return () => sub.remove();
    }, [goHome]),
  );

  const footer = (
    <StickyFooter>
      <Button title="Track order" height={56} onPress={() => router.replace(`/orders/${id}`)} disabled={!order.data} />
      <Pressable onPress={goHome} style={styles.secondary} accessibilityRole="button">
        <Text size={15} weight="medium" color={colors.indigo}>Continue shopping</Text>
      </Pressable>
    </StickyFooter>
  );

  if (order.isLoading) return <Screen scroll={false} footer={footer}><LoadingView /></Screen>;
  if (!order.data) return <Screen scroll={false} footer={footer}><ErrorView error={order.error} onRetry={() => order.refetch()} /></Screen>;

  const o = order.data;
  const items = o.products.reduce((n, p) => n + p.quantity, 0);
  return (
    <Screen footer={footer} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.ring}>
          <View style={styles.check}><Check size={40} color={colors.white} strokeWidth={2.5} /></View>
        </View>
        <Text size={28} weight="bold" align="center" accessibilityRole="header">Order confirmed!</Text>
        <Text size={15} color={colors.body} lineHeight={22} align="center" style={{ maxWidth: 300 }}>
          Thank you{o.firstName ? `, ${o.firstName}` : ''}. A receipt is on its way to {o.email}.
        </Text>
      </View>

      <View style={styles.card}>
        <Row label="Order number" value={`#${o.randomId}`} />
        <Row label="Placed" value={shortDate(o.createdAt)} />
        <Row label="Items" value={String(items)} />
        <Row label="Payment" value={PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod} />
        <Row label="Shipping" value={o.shippingCost === 0 ? 'Free' : money(o.shippingCost)} />
        <Divider />
        <View style={styles.row}>
          <Text size={14} color={colors.muted}>Total</Text>
          <Text size={17} weight="bold" color={colors.navy}>{money(o.totalPrice)}</Text>
        </View>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text size={14} color={colors.muted}>{label}</Text>
      <Text size={14} weight="medium" style={{ flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingTop: 32 },
  hero: { alignItems: 'center', gap: 16 },
  ring: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  check: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.white, borderRadius: 28, padding: 24, gap: 16,
    shadowColor: colors.navy, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  secondary: { height: 40, alignItems: 'center', justifyContent: 'center' },
});
