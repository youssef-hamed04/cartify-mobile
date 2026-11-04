import { RefreshControl, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Check, ClipboardCheck, MapPin, Package, PackageCheck, Truck, Undo2, X, type LucideIcon } from 'lucide-react-native';
import type { Order, OrderStatus } from '@/api';
import { Button } from '@/components/Button';
import { Divider } from '@/components/Misc';
import { Screen, ScreenHeader, StickyFooter } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { OrderStatusPill, canReturn } from '@/features/orders/OrderStatusPill';
import { SummaryRow } from '@/features/orders/SummaryRow';
import { useOrder } from '@/hooks/queries';
import { dateTime, money } from '@/lib/format';
import { colors } from '@/theme';

const FLOW: { status: OrderStatus; label: string; Icon: LucideIcon }[] = [
  { status: 'placed', label: 'Order placed', Icon: ClipboardCheck },
  { status: 'confirmed', label: 'Confirmed', Icon: PackageCheck },
  { status: 'shipping', label: 'Out for delivery', Icon: Truck },
  { status: 'delivered', label: 'Delivered', Icon: Package },
];

interface Step { label: string; time?: string; Icon: LucideIcon; state: 'done' | 'current' | 'todo' | 'stopped' }

// Timeline from the real status + statusHistory; cancelled/refunded end the flow where it stopped
function buildSteps(order: Order): Step[] {
  const timeOf = (s: OrderStatus) => {
    const h = [...order.statusHistory].reverse().find((x) => x.status === s);
    return h ? dateTime(h.changedAt) : s === 'placed' ? dateTime(order.createdAt) : undefined;
  };
  const terminal = order.status === 'cancelled' || order.status === 'refunded';
  if (terminal) {
    const reached = FLOW.filter((f) => f.status === 'placed' || order.statusHistory.some((h) => h.status === f.status));
    return [
      ...reached.map((f) => ({ label: f.label, time: timeOf(f.status), Icon: f.Icon, state: 'done' as const })),
      { label: order.status === 'cancelled' ? 'Cancelled' : 'Refunded', time: timeOf(order.status), Icon: X, state: 'stopped' },
    ];
  }
  const idx = FLOW.findIndex((f) => f.status === order.status);
  return FLOW.map((f, i) => ({
    label: f.label,
    time: i <= idx ? timeOf(f.status) : undefined,
    Icon: f.Icon,
    state: i < idx || order.status === 'delivered' ? 'done' : i === idx ? 'current' : 'todo',
  }));
}

export default function TrackOrderScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const order = useOrder(id);
  const o = order.data;
  const header = <ScreenHeader title="Track order" subtitle={o ? `#${o.randomId}` : undefined} />;

  if (order.isLoading) return <Screen scroll={false} header={header}><LoadingView /></Screen>;
  if (!o) return <Screen scroll={false} header={header}><ErrorView error={order.error} onRetry={() => order.refetch()} /></Screen>;

  const steps = buildSteps(o);
  const returnable = canReturn(o);

  return (
    <Screen
      header={header}
      contentStyle={styles.content}
      scrollProps={{ refreshControl: <RefreshControl refreshing={order.isRefetching} onRefresh={() => { order.refetch(); }} tintColor={colors.navy} /> }}
      footer={
        returnable ? (
          <StickyFooter>
            <Button
              title="Return an item"
              height={56}
              leftIcon={<Undo2 size={20} color={colors.white} />}
              onPress={() => router.push({ pathname: '/return/select', params: { orderId: o._id } })}
            />
          </StickyFooter>
        ) : undefined
      }
    >
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text size={16} weight="bold">Status</Text>
          <OrderStatusPill order={o} />
        </View>
        {steps.map((s, i) => <TimelineStep key={s.label} step={s} last={i === steps.length - 1} />)}
        {o.trackingNumber ? (
          <View style={styles.tracking}>
            <Text size={13} color={colors.muted}>Tracking number</Text>
            <Text size={14} weight="bold" selectable>{o.trackingNumber}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.addressRow}>
          <View style={styles.iconCircle}><MapPin size={22} color={colors.white} /></View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text size={15} weight="bold">{o.firstName} {o.lastName}</Text>
            <Text size={13} color={colors.muted} lineHeight={18}>{o.address}, {o.city}, {o.governorate}</Text>
            <Text size={13} color={colors.muted}>{o.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text size={16} weight="bold">Items</Text>
        {o.products.map((p, i) => (
          <View key={`${p.name}-${p.color}-${i}`} style={styles.itemRow}>
            <View style={styles.thumb}>
              {p.imageUrl ? <Image source={p.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Package size={20} color={colors.navy} />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text size={14} weight="bold" numberOfLines={2}>{p.name}</Text>
              <Text size={12} color={colors.muted}>
                {p.color} · Qty {p.quantity}{p.isRefundRequested ? ' · Return requested' : ''}
              </Text>
            </View>
            <Text size={14} weight="bold" color={colors.navy}>{money(p.unitPrice * p.quantity)}</Text>
          </View>
        ))}
        <Divider />
        <SummaryRow label="Subtotal" value={money(o.subtotal)} size={14} />
        <SummaryRow label="Shipping" value={o.shippingCost === 0 ? 'Free' : money(o.shippingCost)} size={14} valueColor={o.shippingCost === 0 ? colors.success : colors.ink} />
        <View style={styles.totalRow}>
          <Text size={16} weight="bold">Total</Text>
          <Text size={20} weight="bold" color={colors.navy}>{money(o.totalPrice)}</Text>
        </View>
        <Text size={12} color={colors.muted}>
          {o.paymentMethod === 'cash' ? 'Cash on delivery' : o.paymentMethod}{o.isPaid ? ' · Paid' : ''}
        </Text>
      </View>
    </Screen>
  );
}

function TimelineStep({ step, last }: { step: Step; last: boolean }) {
  const done = step.state === 'done';
  const current = step.state === 'current';
  const stopped = step.state === 'stopped';
  const dotBg = stopped ? colors.danger : done ? colors.navy : current ? colors.indigo : colors.white;
  const Icon = done ? Check : step.Icon;
  return (
    <View style={styles.step} accessible accessibilityLabel={`${step.label}${step.time ? `, ${step.time}` : ''}`}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: dotBg }, step.state === 'todo' && styles.dotTodo]}>
          <Icon size={16} color={step.state === 'todo' ? colors.muted : colors.white} strokeWidth={2.5} />
        </View>
        {!last ? <View style={[styles.line, { backgroundColor: done ? colors.navy : colors.border }]} /> : null}
      </View>
      <View style={styles.stepText}>
        <Text size={16} weight="bold" color={step.state === 'todo' ? colors.muted : stopped ? colors.danger : colors.ink}>{step.label}</Text>
        <Text size={13} color={colors.muted}>{step.time ?? (done ? 'Completed' : current ? 'In progress' : 'Pending')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 24, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  step: { flexDirection: 'row', gap: 16 },
  rail: { width: 32, alignItems: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dotTodo: { borderWidth: 1.5, borderColor: colors.border },
  line: { width: 2, height: 36, borderRadius: 1 },
  stepText: { flex: 1, paddingTop: 2, gap: 4, minHeight: 43 },
  tracking: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 16, padding: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
