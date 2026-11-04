import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Box, Package, Truck, Undo2 } from 'lucide-react-native';
import type { Order } from '@/api';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Misc';
import { Screen, ScreenHeader } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { OrderStatusPill, canReturn, isActiveOrder } from '@/features/orders/OrderStatusPill';
import { useOrders } from '@/hooks/queries';
import { money, shortDate } from '@/lib/format';
import { colors, spacing } from '@/theme';

const FILTERS = {
  All: () => true,
  Active: isActiveOrder,
  Delivered: (o: Order) => o.status === 'delivered',
  Returns: (o: Order) => o.products.some((p) => p.isRefundRequested),
  Cancelled: (o: Order) => o.status === 'cancelled' || o.status === 'refunded',
} as const;
type Filter = keyof typeof FILTERS;

export default function OrdersScreen() {
  const orders = useOrders();
  const [filter, setFilter] = useState<Filter>('All');
  const list = useMemo(() => (orders.data ?? []).filter(FILTERS[filter]), [orders.data, filter]);
  const count = orders.data?.length ?? 0;

  const header = (
    <>
      <ScreenHeader title="My Orders" subtitle={orders.data ? `${count} ${count === 1 ? 'order' : 'orders'}` : undefined} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={{ flexGrow: 0 }}>
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
    </>
  );

  if (orders.isLoading) return <Screen scroll={false} header={header}><LoadingView /></Screen>;
  if (orders.error && !orders.data) return <Screen scroll={false} header={header}><ErrorView error={orders.error} onRetry={() => orders.refetch()} /></Screen>;

  return (
    <Screen scroll={false} header={header} edges={['top']}>
      <FlatList
        data={list}
        keyExtractor={(o) => o._id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => { orders.refetch(); }} tintColor={colors.navy} />}
        ListEmptyComponent={
          <EmptyView
            icon={<Package size={30} color={colors.navy} />}
            title={count ? `No ${filter.toLowerCase()} orders` : 'No orders yet'}
            message={count ? 'Try another filter.' : 'When you place an order it will show up here.'}
            action={count ? undefined : <Button title="Start Shopping" onPress={() => router.push('/shop')} />}
          />
        }
      />
    </Screen>
  );
}

function OrderCard({ order }: { order: Order }) {
  const thumbs = order.products.slice(0, 3);
  const names = order.products.map((p) => p.name);
  const summary = names.length > 1 ? `${names[0]} + ${names.length - 1} more` : names[0] ?? '';
  const returning = order.products.some((p) => p.isRefundRequested);

  let action: { label: string; Icon: typeof Truck; onPress: () => void } | null = null;
  if (isActiveOrder(order)) action = { label: 'Track order', Icon: Truck, onPress: () => router.push(`/orders/${order._id}`) };
  else if (canReturn(order)) action = { label: 'SmartBox return', Icon: Undo2, onPress: () => router.push({ pathname: '/return/select', params: { orderId: order._id } }) };
  else if (returning) action = { label: 'Track return', Icon: Box, onPress: () => router.push('/returns') };

  return (
    <Pressable onPress={() => router.push(`/orders/${order._id}`)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]} accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Text size={16} weight="bold">Order #{order.randomId}</Text>
          <Text size={13} color={colors.muted}>{shortDate(order.createdAt)}</Text>
        </View>
        <OrderStatusPill order={order} />
      </View>
      <View style={styles.itemsRow}>
        <View style={[styles.thumbs, { width: 44 + (thumbs.length - 1) * 30 }]}>
          {thumbs.map((p, i) => (
            <View key={`${p.name}-${p.color}-${i}`} style={[styles.thumb, { left: i * 30, zIndex: 3 - i }]}>
              {p.imageUrl ? <Image source={p.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Package size={20} color={colors.navy} />}
            </View>
          ))}
        </View>
        <Text size={14} weight="medium" color={colors.body} numberOfLines={2} style={{ flex: 1 }}>{summary}</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text size={20} weight="bold" color={colors.navy} tracking={-0.2}>{money(order.totalPrice)}</Text>
        {action ? (
          <Pressable onPress={action.onPress} style={styles.action} accessibilityRole="button" hitSlop={4}>
            <action.Icon size={16} color={colors.navy} />
            <Text size={14} weight="bold" color={colors.navy}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 16, paddingHorizontal: spacing.screen, paddingBottom: 24, paddingTop: 8 },
  list: { gap: 24, paddingHorizontal: spacing.screen, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 8,
    shadowColor: colors.navy, shadowOpacity: 0.06, shadowRadius: 9, shadowOffset: { width: 0, height: 8 }, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  thumbs: { height: 44 },
  thumb: {
    position: 'absolute', width: 44, height: 44, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.lavender,
    borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16, borderRadius: 9999, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
});
