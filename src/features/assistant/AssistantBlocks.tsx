import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BadgeCheck, ShoppingCart, Sparkles } from 'lucide-react-native';
import type { AssistantBlock } from '@/api';
import { Button } from '@/components/Button';
import { ProductCard } from '@/components/ProductCard';
import { Text } from '@/components/Text';
import { OrderStatusPill } from '@/features/orders/OrderStatusPill';
import { dateTime, money } from '@/lib/format';
import { colors, radius } from '@/theme';

// Model text supports **bold** and "- " lists only; everything else renders as plain text.
export function RichText({ text, color = colors.ink }: { text: string; color?: string }) {
  const renderInline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <Text key={i} size={15} weight="bold" color={color}>{part.slice(2, -2)}</Text>
        : <Fragment key={i}>{part}</Fragment>);
  return (
    <View style={{ gap: 4 }}>
      {text.split('\n').filter((l) => l.trim()).map((line, i) => {
        const li = line.match(/^\s*(?:[-•*]|\d+\.)\s+(.*)$/);
        return li ? (
          <View key={i} style={styles.li}>
            <Text size={15} color={color} lineHeight={21}>•</Text>
            <Text size={15} color={color} lineHeight={21} style={{ flex: 1 }}>{renderInline(li[1])}</Text>
          </View>
        ) : (
          <Text key={i} size={15} color={color} lineHeight={21}>{renderInline(line)}</Text>
        );
      })}
    </View>
  );
}

export function AiLabel() {
  return (
    <View style={styles.aiLabel}>
      <Sparkles size={11} color={colors.muted} />
      <Text size={11} color={colors.muted}>AI-generated · check details on the product page</Text>
    </View>
  );
}

function Verified({ label }: { label: string }) {
  return (
    <View style={styles.verified}>
      <BadgeCheck size={14} color={colors.success} />
      <Text size={11} weight="bold" color={colors.success} tracking={0.4}>{label.toUpperCase()}</Text>
    </View>
  );
}

interface BlockProps {
  block: AssistantBlock;
  onDecide?: (actionId: string, decision: 'confirm' | 'cancel') => Promise<string>;
  handled?: boolean;
}

function ConfirmCard({ block, onDecide, handled }: BlockProps & { block: Extract<AssistantBlock, { type: 'confirm_action' }> }) {
  const [state, setState] = useState<{ busy?: boolean; result?: string; failed?: boolean }>(handled ? { result: 'Handled' } : {});
  const decide = async (decision: 'confirm' | 'cancel') => {
    if (!onDecide) return;
    setState({ busy: true });
    try {
      setState({ result: await onDecide(block.actionId, decision) });
    } catch (e) {
      setState({ result: e instanceof Error ? e.message : 'Something went wrong', failed: true });
    }
  };
  return (
    <View style={[styles.block, styles.confirm]}>
      <View style={styles.rowCenter}>
        <ShoppingCart size={16} color={colors.navy} />
        <Text size={15} weight="bold" color={colors.navy}>{block.title}</Text>
      </View>
      <View style={styles.line}>
        {block.product.image ? <Image source={block.product.image} style={styles.thumb} contentFit="cover" /> : null}
        <View style={{ flex: 1 }}>
          <Text size={14} weight="bold" numberOfLines={2}>{block.product.name}</Text>
          <Text size={12} color={colors.muted}>{block.color} · Qty {block.quantity}</Text>
        </View>
        <Text size={15} weight="bold" color={colors.navy}>{money(block.lineTotal)}</Text>
      </View>
      {state.result ? (
        <Text size={13} weight="semibold" color={state.failed ? colors.danger : colors.success}>{state.result}</Text>
      ) : (
        <View style={styles.actions}>
          <Button title="Cancel" variant="outline" height={44} style={{ flex: 1 }} disabled={state.busy} onPress={() => decide('cancel')} />
          <Button title="Confirm" height={44} style={{ flex: 1 }} loading={state.busy} onPress={() => decide('confirm')} />
        </View>
      )}
    </View>
  );
}

export function AssistantBlockView(props: BlockProps) {
  const { block } = props;
  switch (block.type) {
    case 'products':
      return (
        <View style={styles.block}>
          <Verified label={`From the Cartify catalog${block.title ? ` · ${block.title}` : ''}`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {(block.fullProducts ?? []).map((p) => <ProductCard key={p._id} product={p} width={160} />)}
          </ScrollView>
        </View>
      );
    case 'comparison':
      return (
        <View style={styles.block}>
          <Verified label="Comparison from the catalog" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {block.products.map((p) => (
              <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)} style={styles.compareCol} accessibilityRole="button">
                {p.image ? <Image source={p.image} style={styles.compareImg} contentFit="cover" /> : null}
                <Text size={14} weight="bold" numberOfLines={2}>{p.name}</Text>
                <Text size={16} weight="bold" color={colors.navy}>{money(p.price)}</Text>
                {[
                  ['Rating', `${p.rating.toFixed(1)} ★ (${p.reviews})`],
                  ['Brand', p.brand || '—'],
                  ['Category', p.category],
                  ['In stock', p.inStockColors.length ? p.inStockColors.join(', ') : 'Out of stock'],
                ].map(([label, value]) => (
                  <View key={label}>
                    <Text size={11} color={colors.muted}>{label}</Text>
                    <Text size={13}>{value}</Text>
                  </View>
                ))}
                <Text size={12} color={colors.muted} lineHeight={16}>{p.description}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );
    case 'cart':
      return (
        <View style={styles.block}>
          <Verified label="Your cart" />
          {block.items.length ? block.items.map((i) => (
            <View key={`${i.productId}:${i.color}`} style={styles.line}>
              {i.image ? <Image source={i.image} style={styles.thumb} contentFit="cover" /> : null}
              <View style={{ flex: 1 }}>
                <Text size={14} weight="semibold" numberOfLines={1}>{i.name}</Text>
                <Text size={12} color={colors.muted}>{i.color} · {i.quantity} × {money(i.unitPrice)}</Text>
              </View>
              <Text size={14} weight="bold">{money(i.lineTotal)}</Text>
            </View>
          )) : <Text color={colors.muted}>Your cart is empty.</Text>}
          {block.items.length ? (
            <View style={[styles.line, styles.total]}>
              <Text size={14} color={colors.body} style={{ flex: 1 }}>Subtotal ({block.totalQuantity})</Text>
              <Text size={16} weight="bold" color={colors.navy}>{money(block.subtotal)}</Text>
            </View>
          ) : null}
          <Button title="Go to cart" variant="outline" height={44} onPress={() => router.push('/cart')} />
        </View>
      );
    case 'order': {
      const o = block.order;
      return (
        <View style={styles.block}>
          <Verified label={`Order #${o.orderNumber}`} />
          <View style={styles.rowCenter}>
            <OrderStatusPill order={{ status: o.status, products: [] }} />
            <Text size={13} color={colors.muted}>{money(o.total)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'}</Text>
          </View>
          <View style={styles.timeline}>
            {o.history.map((h, i) => (
              <View key={i} style={styles.line}>
                <View style={styles.dot} />
                <Text size={13} weight="semibold" style={{ flex: 1 }}>{h.label}</Text>
                <Text size={12} color={colors.muted}>{dateTime(h.at)}</Text>
              </View>
            ))}
          </View>
          {o.trackingNumber ? <Text size={12} color={colors.muted}>Tracking number: {o.trackingNumber}</Text> : null}
          <Button title="View order" variant="outline" height={44} onPress={() => router.push(`/orders/${o.orderId}`)} />
        </View>
      );
    }
    case 'confirm_action':
      return <ConfirmCard {...props} block={block} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  li: { flexDirection: 'row', gap: 8 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  block: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 },
  confirm: { backgroundColor: colors.lavender, borderColor: colors.periwinkle },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bg },
  actions: { flexDirection: 'row', gap: 10 },
  total: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  compareCol: { width: 170, gap: 6, padding: 10, borderRadius: radius.md, backgroundColor: colors.bg },
  compareImg: { width: '100%', height: 90, borderRadius: 12, backgroundColor: colors.lavender },
  timeline: { gap: 6, paddingLeft: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy },
});
