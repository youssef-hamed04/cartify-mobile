import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, Plus, Star } from 'lucide-react-native';
import type { Product } from '@/api';
import { useAddToCart, useIsWishlisted, useToggleWishlist } from '@/hooks/queries';
import { isNewArrival, money, productImage } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { colors } from '@/theme';
import { Text } from './Text';

// Product card from the Home design (160 wide, 30 radius, 8 padding, 116 image, navy + button)
export function ProductCard({ product, width = 160 }: { product: Product; width?: number | `${number}%` }) {
  const wishlisted = useIsWishlisted(product._id);
  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();
  const toast = useToast();
  const firstInStock = product.variants.find((v) => v.stock - v.reserved > 0);
  const hasDiscount = product.discount > 0 && product.finalPrice < product.price;
  const tag = hasDiscount ? 'Hot Deal' : isNewArrival(product) ? 'New Arrival' : null;

  const onAdd = () => {
    if (!firstInStock) return toast.show('Out of stock', 'error');
    // Products with several colors need a choice, so open the details page
    if (product.variants.length > 1) return router.push(`/product/${product._id}`);
    addToCart.mutate(
      { productId: product._id, color: firstInStock.color },
      {
        onSuccess: () => toast.show(`${product.name} added to cart`),
        onError: (e) => toast.show(e.message, 'error'),
      },
    );
  };

  return (
    <Pressable
      onPress={() => router.push(`/product/${product._id}`)}
      style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${money(product.finalPrice)}`}
    >
      <View style={styles.imageWrap}>
        <Image source={productImage(product)} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        {tag ? (
          <View style={[styles.tag, tag === 'Hot Deal' && { backgroundColor: colors.coral }]}>
            <Text size={10} weight="bold" tracking={0.4} color={tag === 'Hot Deal' ? colors.white : colors.navy}>{tag}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => toggleWishlist.mutate(product._id, { onError: (e) => toast.show(e.message, 'error') })}
          hitSlop={8}
          style={styles.heart}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} color={wishlisted ? colors.coral : colors.ink} fill={wishlisted ? colors.coral : 'transparent'} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={styles.info}>
        <View style={styles.rating}>
          <Star size={13} color={colors.star} fill={colors.star} />
          <Text size={12} weight="medium" color={colors.muted}>{product.rating.average.toFixed(1)}</Text>
          {hasDiscount ? (
            <Text size={12} color={colors.muted} style={styles.strike}>{money(product.price)}</Text>
          ) : null}
        </View>
        <Text size={14} weight="bold" lineHeight={18} numberOfLines={2} style={styles.name}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text size={18} weight="bold" color={colors.navy} tracking={-0.18} numberOfLines={1} style={{ flexShrink: 1 }}>
            {money(product.finalPrice)}
          </Text>
          <Pressable
            onPress={onAdd}
            disabled={addToCart.isPending}
            style={({ pressed }) => [styles.add, (pressed || addToCart.isPending) && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
          >
            <Plus size={18} color={colors.white} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    padding: 8,
    gap: 10,
    shadowColor: colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  imageWrap: { height: 116, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.lavender },
  tag: { position: 'absolute', left: 8, top: 10, backgroundColor: colors.white, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  heart: { position: 'absolute', right: 8, top: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  info: { paddingHorizontal: 6, paddingBottom: 6, gap: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  strike: { textDecorationLine: 'line-through', marginLeft: 6 },
  name: { height: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  add: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
