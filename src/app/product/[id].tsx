import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, Heart, Minus, Plus, Share2, ShoppingCart, Star, Undo2 } from 'lucide-react-native';
import type { Review } from '@/api';
import { Button, IconButton } from '@/components/Button';
import { goBack, StickyFooter } from '@/components/Screen';
import { LightStatusBar } from '@/components/LightStatusBar';
import { Text } from '@/components/Text';
import { ErrorView, LoadingView } from '@/components/States';
import { first } from '@/features/browse/params';
import { isNotFound, useAddToCart, useIsWishlisted, useProduct, useReviews, useToggleWishlist } from '@/hooks/queries';
import { isNewArrival, money, shortDate } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { colors, heroGradient, spacing } from '@/theme';

const GALLERY_HEIGHT = 380;

export default function ProductScreen() {
  const id = first(useLocalSearchParams().id) ?? '';
  const { data: product, isLoading, error, refetch } = useProduct(id);
  const reviews = useReviews(id);
  const wishlisted = useIsWishlisted(id);
  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [pickedColor, setPickedColor] = useState<string>();
  const [pickedQty, setQty] = useState(1);
  const [slide, setSlide] = useState(0);

  // Default to the first in-stock color until the user picks one
  const color = pickedColor ?? (product?.variants.find((v) => v.stock - v.reserved > 0) ?? product?.variants[0])?.color;
  const variant = product?.variants.find((v) => v.color === color);
  const available = variant ? Math.max(0, variant.stock - variant.reserved) : 0;
  const qty = Math.max(1, Math.min(pickedQty, available || 1));
  const images = useMemo(() => variant?.images.filter((i) => i.url) ?? [], [variant]);

  const selectColor = (c: string) => {
    setPickedColor(c);
    setQty(1);
    setSlide(0);
  };

  if (isLoading) return <View style={styles.flex}><LoadingView /></View>;
  if (error || !product) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <View style={{ paddingHorizontal: spacing.screen }}><BackBtn /></View>
        {isNotFound(error) ? <ErrorView error={new Error('This product is no longer available.')} /> : <ErrorView error={error} onRetry={refetch} />}
      </View>
    );
  }

  const hasDiscount = product.discount > 0 && product.finalPrice < product.price;

  const onAdd = () => {
    if (!variant) return;
    addToCart.mutate(
      { productId: product._id, color: variant.color, quantity: qty },
      {
        onSuccess: () => toast.show(`${qty} × ${product.name} added to cart`),
        // StockLimitError carries "Only N left in stock"
        onError: (e) => toast.show(e.message, 'error'),
      },
    );
  };

  const onShare = () => Share.share({ message: `${product.name} — ${money(product.finalPrice)} on Cartify` }).catch(() => {});

  return (
    <View style={styles.flex}>
      <LightStatusBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Gallery */}
        <LinearGradient {...heroGradient} style={[styles.gallery, { height: GALLERY_HEIGHT + insets.top }]}>
          <View pointerEvents="none" style={[styles.glow, { width: 300, height: 300, right: -110, top: -60, backgroundColor: colors.indigo, opacity: 0.8 }]} />
          <View pointerEvents="none" style={[styles.glow, { width: 230, height: 230, left: -90, bottom: -70, backgroundColor: colors.periwinkle, opacity: 0.5 }]} />
          <FlatList
            data={images.length ? images : [{ url: '' }]}
            keyExtractor={(img, i) => `${img.url}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / width))}
            style={{ marginTop: insets.top + 64 }}
            renderItem={({ item }) => (
              <View style={[styles.slide, { width }]}>
                <View style={styles.plate}>
                  {item.url ? <Image source={item.url} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : <ShoppingCart size={64} color={colors.white} />}
                </View>
              </View>
            )}
          />
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((img, i) => <View key={`${img.url}-${i}`} style={[styles.dot, i === slide && styles.dotActive]} />)}
            </View>
          ) : null}
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <BackBtn />
            <View style={styles.topRight}>
              <IconButton label="Share" onPress={onShare} size={46}><Share2 size={22} color={colors.ink} /></IconButton>
              <IconButton
                label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                onPress={() => toggleWishlist.mutate(product._id, { onError: (e) => toast.show(e.message, 'error') })}
                size={46}
              >
                <Heart size={22} color={wishlisted ? colors.coral : colors.ink} fill={wishlisted ? colors.coral : 'transparent'} />
              </IconButton>
            </View>
          </View>
          {hasDiscount || isNewArrival(product) ? (
            <View style={[styles.tag, { top: insets.top + 70 }, hasDiscount && { backgroundColor: colors.coral }]}>
              <Text size={12} weight="bold" color={hasDiscount ? colors.white : colors.navy}>{hasDiscount ? `-${product.discount}% Hot Deal` : 'New Arrival'}</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Details sheet */}
        <View style={styles.details}>
          <View style={styles.between}>
            <Text size={14} color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>{[product.category, product.brand].filter(Boolean).join(' · ')}</Text>
            <View style={[styles.stock, !available && { backgroundColor: colors.dangerBg }]}>
              {available ? <Check size={12} color={colors.success} strokeWidth={3} /> : null}
              <Text size={12} weight="bold" color={available ? colors.success : colors.danger}>
                {available ? (available <= 5 ? `Only ${available} left` : 'In stock') : 'Out of stock'}
              </Text>
            </View>
          </View>
          <Text size={28} weight="bold" tracking={-0.56} lineHeight={34} accessibilityRole="header">{product.name}</Text>
          <View style={styles.between}>
            <View style={styles.inline}>
              <Star size={18} color={colors.star} fill={colors.star} />
              <Text size={16} weight="bold">{product.rating.average.toFixed(1)}</Text>
              <Text size={14} color={colors.muted}>({product.rating.count} reviews)</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {hasDiscount ? <Text size={14} color={colors.muted} style={{ textDecorationLine: 'line-through' }}>{money(product.price)}</Text> : null}
              <Text size={30} weight="bold" color={colors.navy} tracking={-0.6}>{money(product.finalPrice)}</Text>
            </View>
          </View>
          <Text size={15} color={colors.body} lineHeight={21}>{product.description}</Text>

          {product.variants.length ? (
            <View style={styles.colors}>
              <Text size={15} weight="bold">Color</Text>
              {product.variants.map((v) => {
                const selected = v.color === color;
                const soldOut = v.stock - v.reserved <= 0;
                return (
                  <Pressable
                    key={v.color}
                    onPress={() => selectColor(v.color)}
                    style={[styles.swatch, selected && styles.swatchActive, soldOut && { opacity: 0.4 }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${v.color}${soldOut ? ', sold out' : ''}`}
                  >
                    <View style={[styles.swatchDot, { backgroundColor: v.colorHex || colors.periwinkle }]} />
                  </Pressable>
                );
              })}
              <Text size={14} color={colors.muted}>{color}</Text>
            </View>
          ) : null}

          <View style={styles.returnInfo}>
            <View style={styles.returnIcon}><Undo2 size={20} color={colors.white} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text size={15} weight="bold">Free SmartBox returns</Text>
              <Text size={13} color={colors.body}>Get a code and drop it at any SmartBox, 24/7</Text>
            </View>
          </View>

          <ReviewsSection reviews={reviews.data?.reviews} total={reviews.data?.total ?? 0} loading={reviews.isLoading} />
        </View>
      </ScrollView>

      <StickyFooter>
        <View style={styles.actionBar}>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1}
              style={[styles.qtyBtn, qty <= 1 && { opacity: 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
            >
              <Minus size={18} color={colors.ink} />
            </Pressable>
            <Text size={18} weight="bold" accessibilityLabel={`Quantity ${qty}`}>{qty}</Text>
            <Pressable
              onPress={() => setQty(Math.min(available, qty + 1))}
              disabled={qty >= available}
              style={[styles.qtyBtn, styles.qtyPlus, qty >= available && { opacity: 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Plus size={18} color={colors.white} />
            </Pressable>
          </View>
          <Button
            title={available ? 'Add to Cart' : 'Out of stock'}
            leftIcon={available ? <ShoppingCart size={20} color={colors.white} /> : undefined}
            onPress={onAdd}
            loading={addToCart.isPending}
            disabled={!available}
            height={56}
            style={{ flex: 1 }}
          />
        </View>
      </StickyFooter>
    </View>
  );
}

function BackBtn() {
  return (
    <IconButton label="Go back" onPress={goBack} size={46}>
      <ChevronLeft size={22} color={colors.ink} />
    </IconButton>
  );
}

function ReviewsSection({ reviews, total, loading }: { reviews?: Review[]; total: number; loading: boolean }) {
  return (
    <View style={{ gap: 12, marginTop: 8 }}>
      <Text size={20} weight="bold" tracking={-0.2}>Reviews{total ? ` (${total})` : ''}</Text>
      {loading ? (
        <Text color={colors.muted}>Loading reviews…</Text>
      ) : !reviews?.length ? (
        <Text color={colors.muted}>No reviews yet.</Text>
      ) : (
        reviews.map((r) => {
          const name = [r.userId?.firstName, r.userId?.lastName].filter(Boolean).join(' ') || 'Cartify customer';
          return (
            <View key={r._id} style={styles.review}>
              <View style={styles.between}>
                <Text size={15} weight="bold" numberOfLines={1} style={{ flex: 1 }}>{name}</Text>
                <Text size={12} color={colors.muted}>{shortDate(r.createdAt)}</Text>
              </View>
              <View style={styles.inline}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} color={colors.star} fill={n <= r.rating ? colors.star : 'transparent'} />
                ))}
                {r.isVerifiedPurchase ? <Text size={12} weight="semibold" color={colors.success} style={{ marginLeft: 6 }}>Verified purchase</Text> : null}
              </View>
              {r.title ? <Text size={14} weight="bold">{r.title}</Text> : null}
              {r.body ? <Text size={14} color={colors.body} lineHeight={20}>{r.body}</Text> : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  gallery: { overflow: 'hidden' },
  glow: { position: 'absolute', borderRadius: 9999 },
  slide: { alignItems: 'center', justifyContent: 'center', height: 270 },
  plate: {
    width: 260, height: 260, borderRadius: 48, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.navyDeep, shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 10,
  },
  dots: { position: 'absolute', bottom: 48, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 24, backgroundColor: colors.white },
  topBar: { position: 'absolute', left: spacing.screen, right: spacing.screen, flexDirection: 'row', justifyContent: 'space-between' },
  topRight: { flexDirection: 'row', gap: 10 },
  tag: { position: 'absolute', left: spacing.screen, backgroundColor: colors.white, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 6 },
  details: {
    marginTop: -32, backgroundColor: colors.white, borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: spacing.screen, paddingTop: 28, gap: 14,
  },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stock: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successBg, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  colors: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatchActive: { borderColor: colors.navy },
  swatchDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  returnInfo: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 24, backgroundColor: colors.lavender },
  returnIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  review: { gap: 6, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepper: { width: 120, height: 48, borderRadius: 9999, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  qtyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  qtyPlus: { backgroundColor: colors.navy },
});
