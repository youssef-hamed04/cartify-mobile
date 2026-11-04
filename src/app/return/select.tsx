import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowRight, Check, ChevronRight, Minus, Package, Plus } from 'lucide-react-native';
import type { Order } from '@/api';
import { Button } from '@/components/Button';
import { Screen, StickyFooter } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { FlowHeader } from '@/features/returns/FlowHeader';
import { useReturnDraft, type DraftItem } from '@/features/returns/draft';
import { deliveredAt, orderItemProductId } from '@/features/returns/utils';
import { useOrder, useOrders } from '@/hooks/queries';
import { money, shortDate } from '@/lib/format';
import { colors } from '@/theme';

// Figma 27 · Return 1 · Select Items
export default function SelectItemsScreen() {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const paramOrderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const draft = useReturnDraft();

  useEffect(() => {
    if (paramOrderId) draft.setOrderId(paramOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramOrderId]);

  const orderId = paramOrderId ?? draft.orderId;
  return orderId ? <ItemsStep orderId={orderId} canChangeOrder={!paramOrderId} /> : <OrderStep />;
}

// No order given: pick one of the delivered orders first
function OrderStep() {
  const { data, isLoading, error, refetch } = useOrders();
  const draft = useReturnDraft();
  const delivered = (data ?? []).filter((o) => o.status === 'delivered');

  return (
    <Screen>
      <FlowHeader step={1} label="Select items" title={'Which order is\nit from?'} subtitle="Returns are available for delivered orders." />
      {isLoading ? <LoadingView /> : error ? <ErrorView error={error} onRetry={refetch} /> : delivered.length === 0 ? (
        <EmptyView
          title="No delivered orders yet"
          message="Once an order is delivered you can return items from it here."
          action={<Button title="Browse orders" variant="outline" height={48} onPress={() => router.push('/orders')} />}
        />
      ) : (
        <View style={{ gap: 14 }}>
          {delivered.map((order) => (
            <Pressable
              key={order._id}
              onPress={() => draft.setOrderId(order._id)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={`Order ${order.randomId}`}
            >
              <View style={styles.thumb}>
                {order.products[0]?.imageUrl
                  ? <Image source={order.products[0].imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
                  : <Package size={30} color={colors.white} />}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text size={16} weight="bold" color={colors.navy}>Order #{order.randomId}</Text>
                <Text size={13} color={colors.muted}>
                  {order.products.length} item{order.products.length === 1 ? '' : 's'} · Delivered {shortDate(deliveredAt(order))}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function ItemsStep({ orderId, canChangeOrder }: { orderId: string; canChangeOrder: boolean }) {
  const { data: order, isLoading, error, refetch } = useOrder(orderId);
  const draft = useReturnDraft();

  if (isLoading) return <Screen><FlowHeader step={1} label="Select items" title={'What are you\nreturning?'} subtitle="Pick the items from your order." /><LoadingView /></Screen>;
  if (error || !order) return <Screen><FlowHeader step={1} label="Select items" title={'What are you\nreturning?'} subtitle="Pick the items from your order." /><ErrorView error={error} onRetry={refetch} /></Screen>;

  return <ItemsList order={order} canChangeOrder={canChangeOrder} draftItems={draft.items} setItems={draft.setItems} clearOrder={() => draft.setOrderId(null)} />;
}

function ItemsList({ order, canChangeOrder, draftItems, setItems, clearOrder }: {
  order: Order;
  canChangeOrder: boolean;
  draftItems: DraftItem[];
  setItems: (items: DraftItem[]) => void;
  clearOrder: () => void;
}) {
  const key = (productId: string, color: string) => `${productId}:${color}`;
  const selected = useMemo(() => new Map(draftItems.map((i) => [key(i.productId, i.color), i])), [draftItems]);
  const total = draftItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const notDelivered = order.status !== 'delivered';

  const toggle = (item: Order['products'][number]) => {
    const productId = orderItemProductId(item);
    const k = key(productId, item.color);
    if (selected.has(k)) setItems(draftItems.filter((i) => key(i.productId, i.color) !== k));
    else setItems([...draftItems, { productId, name: item.name, color: item.color, quantity: item.quantity, max: item.quantity, unitPrice: item.unitPrice }]);
  };

  const setQty = (k: string, quantity: number) =>
    setItems(draftItems.map((i) => (key(i.productId, i.color) === k ? { ...i, quantity: Math.min(i.max, Math.max(1, quantity)) } : i)));

  return (
    <Screen
      footer={
        <StickyFooter>
          <View style={styles.footerRow}>
            <View>
              <Text size={13} color={colors.muted}>Return value</Text>
              <Text size={22} weight="bold" color={colors.navy} tracking={-0.44}>{money(total)}</Text>
            </View>
            <Button
              title="Continue"
              height={58}
              disabled={!draftItems.length}
              icon={<ArrowRight size={20} color={colors.white} />}
              onPress={() => router.push('/return/reason')}
              style={{ flex: 1 }}
            />
          </View>
        </StickyFooter>
      }
    >
      <FlowHeader step={1} label="Select items" title={'What are you\nreturning?'} subtitle="Pick the items from your order." />
      <View style={styles.orderTag}>
        <Text size={14} weight="bold" color={colors.navy}>Order #{order.randomId}</Text>
        <Text size={14} color={colors.muted}>
          · {notDelivered ? `Status: ${order.status}` : `Delivered ${shortDate(deliveredAt(order))}`}
        </Text>
        {canChangeOrder ? (
          <Pressable onPress={clearOrder} hitSlop={8} style={{ marginLeft: 'auto' }} accessibilityRole="button">
            <Text size={14} weight="semibold" color={colors.indigo}>Change</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: 14 }}>
        {order.products.map((item) => {
          const productId = orderItemProductId(item);
          const k = key(productId, item.color);
          const picked = selected.get(k);
          const disabled = !!item.isRefundRequested;
          return (
            <View key={k} style={[styles.card, picked && styles.cardActive, disabled && { opacity: 0.55 }]}>
              <Pressable
                onPress={() => toggle(item)}
                disabled={disabled}
                style={styles.itemRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!picked, disabled }}
                accessibilityLabel={`${item.name}, ${item.color}`}
              >
                <View style={styles.image}>
                  {item.imageUrl
                    ? <Image source={item.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
                    : <Package size={30} color={colors.white} />}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text size={16} weight="bold" lineHeight={20} numberOfLines={2}>{item.name}</Text>
                  <Text size={13} color={colors.muted}>{item.color} · Qty {item.quantity}</Text>
                  {disabled
                    ? <Text size={13} weight="bold" color={colors.warning}>Return requested</Text>
                    : <Text size={15} weight="bold" color={colors.navy}>{money(item.unitPrice)}</Text>}
                </View>
                {!disabled ? (
                  <View style={[styles.checkbox, picked && styles.checkboxOn]}>
                    {picked ? <Check size={16} color={colors.white} strokeWidth={3} /> : null}
                  </View>
                ) : null}
              </Pressable>
              {picked && picked.max > 1 ? (
                <View style={styles.qtyRow}>
                  <Text size={13} weight="medium" color={colors.body}>Quantity to return</Text>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => setQty(k, picked.quantity - 1)} hitSlop={8} style={styles.stepBtn} accessibilityLabel="Decrease quantity">
                      <Minus size={16} color={colors.navy} />
                    </Pressable>
                    <Text size={15} weight="bold">{picked.quantity}</Text>
                    <Pressable onPress={() => setQty(k, picked.quantity + 1)} hitSlop={8} style={styles.stepBtn} accessibilityLabel="Increase quantity">
                      <Plus size={16} color={colors.navy} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orderTag: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 28, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  cardActive: { backgroundColor: colors.lavender, borderWidth: 2, borderColor: colors.indigo, padding: 13 },
  itemRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  thumb: { width: 56, height: 56, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  image: { width: 76, height: 76, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  qtyRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 4 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
});
