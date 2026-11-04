import { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CircleCheck, CircleX, Package, PartyPopper, Truck, Undo2, type LucideIcon } from 'lucide-react-native';
import { Screen, ScreenHeader } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { useOrders, useReturns } from '@/hooks/queries';
import { returnStatusLabel, timeAgo } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';

interface Item { id: string; at: string; title: string; body: string; Icon: LucideIcon; tint: string; href?: string }

const ORDER_COPY: Record<string, { title: string; body: (id: string) => string; Icon: LucideIcon; tint: string }> = {
  placed: { title: 'Order placed', body: (id) => `We received order #${id}.`, Icon: Package, tint: colors.navy },
  confirmed: { title: 'Order confirmed', body: (id) => `Order #${id} is confirmed and being packed.`, Icon: CircleCheck, tint: colors.indigo },
  shipping: { title: 'Order shipped', body: (id) => `Your order #${id} is on its way.`, Icon: Truck, tint: colors.indigo },
  delivered: { title: 'Order delivered', body: (id) => `Order #${id} was delivered. Enjoy!`, Icon: CircleCheck, tint: colors.success },
  cancelled: { title: 'Order cancelled', body: (id) => `Order #${id} was cancelled.`, Icon: CircleX, tint: colors.danger },
  refunded: { title: 'Order refunded', body: (id) => `Order #${id} was refunded.`, Icon: Undo2, tint: colors.success },
};

// 22 · Notifications — an in-app activity feed built from real order and return status changes
// (the backend has no notification or push service yet)
export default function Notifications() {
  const { user } = useAuth();
  const orders = useOrders();
  const returns = useReturns();

  const createdAt = user?.createdAt;
  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    for (const o of orders.data ?? []) {
      for (const h of o.statusHistory ?? []) {
        const copy = ORDER_COPY[h.status];
        if (copy) list.push({ id: `${o._id}-${h.status}`, at: h.changedAt, title: copy.title, body: copy.body(o.randomId), Icon: copy.Icon, tint: copy.tint, href: `/orders/${o._id}` });
      }
    }
    for (const r of returns.data ?? []) {
      list.push({ id: `${r._id}-created`, at: r.createdAt, title: 'Return requested', body: `Your return code for ${r.items[0]?.name ?? 'your item'} is ready.`, Icon: Undo2, tint: colors.indigo, href: `/return/${r._id}` });
      if (r.status !== 'pending') {
        list.push({ id: `${r._id}-${r.status}`, at: r.completedAt ?? r.expiresAt, title: returnStatusLabel[r.status], body: `Return for ${r.items[0]?.name ?? 'your item'}: ${returnStatusLabel[r.status].toLowerCase()}.`, Icon: r.status === 'completed' ? CircleCheck : CircleX, tint: r.status === 'completed' ? colors.success : colors.danger, href: `/return/${r._id}` });
      }
    }
    if (createdAt) {
      list.push({ id: 'welcome', at: createdAt, title: 'Welcome to Cartify', body: 'Your account is ready. Happy shopping!', Icon: PartyPopper, tint: colors.coral });
    }
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [orders.data, returns.data, createdAt]);

  const loading = orders.isLoading || returns.isLoading;
  const error = orders.error ?? returns.error;
  const refresh = () => { orders.refetch(); returns.refetch(); };

  return (
    <Screen scroll={false} header={<ScreenHeader title="Notifications" />}>
      {loading ? <LoadingView /> : error && !items.length ? <ErrorView error={error} onRetry={refresh} /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={orders.isRefetching || returns.isRefetching} onRefresh={refresh} tintColor={colors.navy} />}
          ListEmptyComponent={<EmptyView icon={<Bell size={30} color={colors.navy} />} title="No notifications yet" message="Order and return updates will show up here." />}
          renderItem={({ item }) => (
            <Pressable
              disabled={!item.href}
              onPress={() => item.href && router.push(item.href as never)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              accessibilityRole={item.href ? 'button' : 'text'}
            >
              <View style={[styles.icon, { backgroundColor: `${item.tint}1A` }]}><item.Icon size={22} color={item.tint} /></View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text size={15} weight="bold">{item.title}</Text>
                <Text size={13} color={colors.body} lineHeight={18}>{item.body}</Text>
              </View>
              <Text size={12} color={colors.muted}>{timeAgo(item.at)}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.screen, paddingBottom: 32, gap: 12, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 16, minHeight: 96 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
