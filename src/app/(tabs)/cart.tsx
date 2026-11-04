import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2, Undo2 } from 'lucide-react-native';
import { cartApi, type CartItem, type Product } from '@/api';
import { Button, IconButton } from '@/components/Button';
import { Divider } from '@/components/Misc';
import { BackButton, Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { SummaryRow } from '@/features/orders/SummaryRow';
import { keys, useCart, useDecrementCart, useIncrementCart, useRemoveFromCart } from '@/hooks/queries';
import { money, productImage } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { colors, spacing } from '@/theme';

type LiveItem = CartItem & { productId: Product };

export default function CartScreen() {
  const cart = useCart();
  const qc = useQueryClient();
  const toast = useToast();
  const empty = useMutation({
    mutationFn: cartApi.empty,
    onSuccess: (data) => qc.setQueryData(keys.cart, data),
    onError: (e) => toast.show(e.message, 'error'),
  });

  const items = (cart.data?.cart.items ?? []).filter((i): i is LiveItem => !!i.productId);
  const count = cart.data?.totalQuantity ?? 0;

  const confirmEmpty = () =>
    Alert.alert('Empty cart?', 'This removes every item from your cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Empty cart', style: 'destructive', onPress: () => empty.mutate() },
    ]);

  const header = (
    <View style={styles.header}>
      <BackButton />
      <View style={styles.title}>
        <Text size={22} weight="bold" tracking={-0.22} accessibilityRole="header">My Cart</Text>
        <Text size={13} color={colors.muted}>{count} {count === 1 ? 'item' : 'items'}</Text>
      </View>
      {items.length ? (
        <IconButton label="Empty cart" bordered size={46} onPress={confirmEmpty}>
          <Trash2 size={22} color={colors.ink} />
        </IconButton>
      ) : <View style={{ width: 46 }} />}
    </View>
  );

  if (cart.isLoading) return <Screen scroll={false} header={header}><LoadingView /></Screen>;
  if (cart.error && !cart.data) return <Screen scroll={false} header={header}><ErrorView error={cart.error} onRetry={() => cart.refetch()} /></Screen>;
  if (!items.length) {
    return (
      <Screen scroll={false} header={header} contentStyle={{ paddingBottom: spacing.tabBar }}>
        <EmptyView
          icon={<ShoppingCart size={30} color={colors.navy} />}
          title="Your cart is empty"
          message="Browse the catalog and add something you love."
          action={<Button title="Start Shopping" onPress={() => router.push('/shop')} icon={<ArrowRight size={20} color={colors.white} />} />}
        />
      </Screen>
    );
  }

  const subtotal = cart.data?.subtotal ?? 0;
  return (
    <Screen
      header={header}
      contentStyle={styles.content}
      scrollProps={{ refreshControl: <RefreshControl refreshing={cart.isRefetching} onRefresh={() => { cart.refetch(); }} tintColor={colors.navy} /> }}
    >
      {items.map((item) => <CartRow key={`${item.productId._id}-${item.color}`} item={item} />)}

      <View style={styles.summary}>
        <SummaryRow label="Subtotal" value={money(subtotal)} />
        <SummaryRow label="Shipping" value="At checkout" valueColor={colors.muted} />
        <SummaryRow label="Smart return" value="Included" valueColor={colors.success} />
        <Divider />
        <View style={styles.totalRow}>
          <Text size={18} weight="bold">Total</Text>
          <Text size={26} weight="bold" color={colors.navy} tracking={-0.52}>{money(subtotal)}</Text>
        </View>
        <Text size={12} color={colors.muted}>Shipping is calculated from your governorate at checkout.</Text>
      </View>

      <Button title="Checkout" onPress={() => router.push('/checkout')} icon={<ArrowRight size={20} color={colors.white} />} />
    </Screen>
  );
}

function CartRow({ item }: { item: LiveItem }) {
  const toast = useToast();
  const inc = useIncrementCart();
  const dec = useDecrementCart();
  const remove = useRemoveFromCart();
  const p = item.productId;
  const line = { productId: p._id, color: item.color };
  const busy = inc.isPending || dec.isPending || remove.isPending;
  const onError = (e: Error) => toast.show(e.message, 'error');

  const confirmRemove = () =>
    Alert.alert('Remove item?', p.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(line, { onError }) },
    ]);

  return (
    <Pressable
      onPress={() => router.push(`/product/${p._id}`)}
      onLongPress={confirmRemove}
      style={[styles.item, busy && { opacity: 0.6 }]}
      accessibilityHint="Long press to remove"
    >
      <View style={styles.thumb}>
        <Image source={productImage(p, item.color)} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      </View>
      <View style={styles.info}>
        <Text size={15} weight="bold" lineHeight={19} numberOfLines={2}>{p.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.returnPill}>
            <Undo2 size={12} color={colors.navy} />
            <Text size={11} weight="bold" color={colors.navy}>Smart return</Text>
          </View>
          <Text size={12} color={colors.muted} numberOfLines={1} style={{ flexShrink: 1 }}>{item.color}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text size={18} weight="bold" color={colors.navy} tracking={-0.18} numberOfLines={1} style={{ flexShrink: 1 }}>{money(p.finalPrice)}</Text>
          <View style={styles.stepper}>
            <Pressable
              disabled={busy}
              onPress={() => (item.quantity <= 1 ? confirmRemove() : dec.mutate(line, { onError }))}
              style={[styles.stepBtn, { backgroundColor: colors.white }]}
              hitSlop={6}
              accessibilityLabel={item.quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
            >
              {item.quantity <= 1 ? <Trash2 size={14} color={colors.danger} /> : <Minus size={14} color={colors.ink} strokeWidth={2.5} />}
            </Pressable>
            <Text size={14} weight="bold" style={{ minWidth: 14, textAlign: 'center' }}>{item.quantity}</Text>
            <Pressable
              disabled={busy}
              onPress={() => inc.mutate(line, { onError })}
              style={[styles.stepBtn, { backgroundColor: colors.navy }]}
              hitSlop={6}
              accessibilityLabel="Increase quantity"
            >
              <Plus size={14} color={colors.white} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 16 },
  title: { alignItems: 'center' },
  content: { gap: 24, paddingTop: 8, paddingBottom: spacing.tabBar },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 28,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.navy, shadowOpacity: 0.06, shadowRadius: 9, shadowOffset: { width: 0, height: 8 }, elevation: 2,
  },
  thumb: { width: 92, height: 104, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.lavender },
  info: { flex: 1, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  returnPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.lavender, borderRadius: 9999, paddingLeft: 8, paddingRight: 10, paddingVertical: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 3, borderRadius: 9999, backgroundColor: colors.bg },
  stepBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 10 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
