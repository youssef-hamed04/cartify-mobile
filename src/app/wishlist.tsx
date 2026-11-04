import { FlatList, Pressable, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Heart, ShoppingCart, Star } from 'lucide-react-native';
import type { Product } from '@/api';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { BrowseHeader, HeaderButton } from '@/features/browse/BrowseHeader';
import { useAddToCart, useCartCount, useToggleWishlist, useWishlist } from '@/hooks/queries';
import { money, productImage } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { colors, spacing } from '@/theme';

const GAP = 16;

export default function WishlistScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useWishlist();
  const cartCount = useCartCount();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.screen * 2 - GAP) / 2;
  const count = data?.length ?? 0;

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <BrowseHeader
        title="Wishlist"
        subtitle={isLoading ? undefined : `${count} saved ${count === 1 ? 'item' : 'items'}`}
        right={
          <HeaderButton label={cartCount ? `Cart, ${cartCount} items` : 'Cart'} onPress={() => router.push('/cart')}>
            <ShoppingCart size={22} color={colors.ink} />
          </HeaderButton>
        }
      />
      {isLoading ? (
        <LoadingView />
      ) : error && !data ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(i) => i.productId!._id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.navy} />}
          renderItem={({ item }) => <WishlistCard product={item.productId!} width={cardWidth} />}
          ListEmptyComponent={
            <EmptyView
              icon={<Heart size={30} color={colors.navy} />}
              title="Your wishlist is empty"
              message="Tap the heart on any product to save it here for later."
              action={<Button title="Start shopping" onPress={() => router.push('/shop')} height={52} />}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function WishlistCard({ product, width }: { product: Product; width: number }) {
  const toggle = useToggleWishlist();
  const addToCart = useAddToCart();
  const toast = useToast();
  const inStock = product.variants.find((v) => v.stock - v.reserved > 0);

  const remove = () => toggle.mutate(product._id, { onError: (e) => toast.show(e.message, 'error') });

  // Move to cart = add the first in-stock color, then drop it from the wishlist
  const moveToCart = () => {
    if (!inStock) return toast.show('Out of stock', 'error');
    if (product.variants.length > 1) return router.push(`/product/${product._id}`);
    addToCart.mutate(
      { productId: product._id, color: inStock.color },
      {
        onSuccess: () => { toast.show(`${product.name} moved to cart`); remove(); },
        onError: (e) => toast.show(e.message, 'error'),
      },
    );
  };

  return (
    <Pressable
      onPress={() => router.push(`/product/${product._id}`)}
      style={[styles.card, { width }]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${money(product.finalPrice)}`}
    >
      <View style={styles.image}>
        <Image source={productImage(product)} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        <Pressable onPress={remove} disabled={toggle.isPending} hitSlop={8} style={styles.saved} accessibilityRole="button" accessibilityLabel="Remove from wishlist">
          <Heart size={16} color={colors.white} fill={colors.white} />
        </Pressable>
        {!inStock ? (
          <View style={styles.soldOut}><Text size={10} weight="bold" color={colors.white}>Sold out</Text></View>
        ) : null}
      </View>
      <View style={styles.info}>
        <View style={styles.inline}>
          <Star size={13} color={colors.star} fill={colors.star} />
          <Text size={12} weight="medium" color={colors.muted}>{product.rating.average.toFixed(1)}</Text>
        </View>
        <Text size={14} weight="bold" lineHeight={18} numberOfLines={2} style={{ height: 36 }}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text size={17} weight="bold" color={colors.navy} numberOfLines={1} style={{ flexShrink: 1 }}>{money(product.finalPrice)}</Text>
          <Pressable
            onPress={moveToCart}
            disabled={addToCart.isPending || !inStock}
            style={[styles.cartBtn, (addToCart.isPending || !inStock) && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel={`Move ${product.name} to cart`}
          >
            <ShoppingCart size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 40, gap: GAP, flexGrow: 1 },
  card: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 28, padding: 11, gap: 12,
    shadowColor: colors.navy, shadowOpacity: 0.05, shadowRadius: 9, shadowOffset: { width: 0, height: 8 }, elevation: 2,
  },
  image: { height: 120, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.lavender },
  saved: { position: 'absolute', right: 8, top: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  soldOut: { position: 'absolute', left: 8, top: 10, backgroundColor: colors.ink, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  info: { paddingHorizontal: 4, gap: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, height: 34 },
  cartBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
