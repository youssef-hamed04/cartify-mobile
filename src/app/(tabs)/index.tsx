import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, Box, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Truck, Undo2 } from 'lucide-react-native';
import { productsApi, type Product } from '@/api';
import { Text } from '@/components/Text';
import { Screen } from '@/components/Screen';
import { Chip, SectionHeader } from '@/components/Misc';
import { ProductCard } from '@/components/ProductCard';
import { ErrorView } from '@/components/States';
import { useCategories, useFeaturedProducts } from '@/hooks/queries';
import { categoryIcon } from '@/lib/categoryIcon';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

// Discounted products for "Hot Deals"; there is no discount filter in the API, so filter a top-rated page
const useHotDeals = () =>
  useQuery({
    queryKey: ['products', 'hotDeals'],
    queryFn: async () => {
      const { products } = await productsApi.list({ limit: 40, sort: 'rating' });
      const deals = products.filter((p) => p.discount > 0);
      return { title: deals.length ? 'Hot Deals' : 'Top Rated', products: (deals.length ? deals : products).slice(0, 8) };
    },
  });

export default function HomeScreen() {
  const { user } = useAuth();
  const featured = useFeaturedProducts();
  const deals = useHotDeals();
  const categories = useCategories();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([featured.refetch(), deals.refetch(), categories.refetch()]);
    setRefreshing(false);
  }, [featured, deals, categories]);

  const name = user?.firstName?.trim();
  const initial = (name || user?.email || 'C').charAt(0).toUpperCase();

  return (
    <Screen
      contentStyle={styles.content}
      scrollProps={{ refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} /> }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Text size={14} color={colors.muted}>{greeting()}</Text>
          <Text size={26} weight="bold" tracking={-0.52} numberOfLines={1}>{name ? `Hi, ${name}` : 'Welcome to Cartify'}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.bell} accessibilityRole="button" accessibilityLabel="Notifications">
            <Bell size={20} color={colors.ink} />
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Profile">
            <LinearGradient colors={[colors.navy, colors.indigo]} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text size={18} weight="bold" color={colors.white}>{initial}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Search (opens the search screen) */}
      <Pressable onPress={() => router.push('/search')} style={styles.search} accessibilityRole="search" accessibilityLabel="Search products">
        <Search size={20} color={colors.muted} />
        <Text size={16} color={colors.muted} style={{ flex: 1 }}>Search products...</Text>
        <View style={styles.filter}><SlidersHorizontal size={18} color={colors.white} /></View>
      </Pressable>

      {/* Hero */}
      <LinearGradient colors={[colors.navyDeep, colors.navy, colors.indigoBright]} locations={[0, 0.357, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.hero}>
        <View style={[styles.glow, { width: 220, height: 220, left: 200, top: -70, opacity: 0.14 }]} />
        <View style={[styles.glow, { width: 140, height: 140, left: 250, top: 110, opacity: 0.1 }]} />
        <View style={styles.heroText}>
          <View style={styles.heroPill}>
            <Sparkles size={13} color={colors.white} />
            <Text size={12} weight="medium" color={colors.white}>Retail Reimagined</Text>
          </View>
          <Text size={24} weight="bold" color={colors.white} lineHeight={28} tracking={-0.48}>Smarter Shopping{'\n'}Starts Here</Text>
          <Pressable onPress={() => router.push('/shop')} style={styles.heroBtn} accessibilityRole="button">
            <Text size={14} weight="bold" color={colors.navy}>Start Shopping</Text>
            <ArrowRight size={16} color={colors.navy} />
          </Pressable>
        </View>
        <LinearGradient colors={[colors.periwinkle, colors.indigo]} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroArt}>
          <ShoppingBag size={52} color={colors.white} strokeWidth={1.8} />
        </LinearGradient>
        <View style={styles.discount}><Text size={22} weight="bold" color={colors.white}>%</Text></View>
      </LinearGradient>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
        {(categories.data ?? []).map((c, i) => {
          const Icon = categoryIcon(c.name);
          return (
            <Chip
              key={c._id}
              label={c.name}
              active={i === 0}
              icon={<Icon size={16} color={i === 0 ? colors.white : colors.ink} />}
              onPress={() => router.push({ pathname: '/shop', params: { category: c.name } })}
            />
          );
        })}
      </ScrollView>

      <SectionHeader title="Featured Products" onSeeAll={() => router.push({ pathname: '/shop', params: { featured: 'true', title: 'Featured' } })} />
      <ProductRow query={featured} />

      {/* SmartBox promo */}
      <LinearGradient colors={[colors.lavender, '#d6d9ff']} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.promo}>
        <View style={[styles.glow, { width: 170, height: 170, left: 219, top: -51, backgroundColor: colors.white, opacity: 0.5 }]} />
        <View style={styles.promoText}>
          <View style={styles.promoPill}>
            <Box size={12} color={colors.white} />
            <Text size={10} weight="bold" color={colors.white} tracking={0.8}>SMARTBOX</Text>
          </View>
          <Text size={22} weight="bold" color={colors.navy} lineHeight={25} tracking={-0.44}>Return Anything.{'\n'}Anytime.</Text>
          <Pressable onPress={() => router.push('/lockers')} style={styles.promoBtn} accessibilityRole="button">
            <Text size={13} weight="bold" color={colors.white}>Find a box now</Text>
            <ArrowRight size={14} color={colors.white} />
          </Pressable>
        </View>
        <LinearGradient colors={[colors.periwinkle, colors.indigo]} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoArt}>
          <Box size={46} color={colors.white} strokeWidth={1.8} />
        </LinearGradient>
      </LinearGradient>

      <SectionHeader title="Why shop with us" />
      <View style={styles.why}>
        {[
          { Icon: Truck, title: 'Fast Delivery', text: 'Hyper-local logistics for record-time arrivals.' },
          { Icon: ShieldCheck, title: 'Secure Pay', text: 'Military-grade encryption on every transaction.' },
          { Icon: Undo2, title: 'Easy Returns', text: 'No labels, no boxes, no stress. Just drop and go.' },
        ].map(({ Icon, title, text }) => (
          <View key={title} style={styles.whyRow}>
            <View style={styles.whyIcon}><Icon size={24} color={colors.navy} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text size={16} weight="bold">{title}</Text>
              <Text size={13} color={colors.body} lineHeight={17}>{text}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionHeader title={deals.data?.title ?? 'Hot Deals'} onSeeAll={() => router.push({ pathname: '/shop', params: { sort: 'rating', title: deals.data?.title ?? 'Hot Deals' } })} />
      <ProductRow query={{ ...deals, data: deals.data?.products }} />
    </Screen>
  );
}

function ProductRow({ query }: { query: { data?: Product[]; isLoading: boolean; error: unknown; refetch: () => unknown } }) {
  if (query.error && !query.data) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;
  if (query.isLoading) {
    return (
      <View style={[styles.row, styles.bleedPad]}>
        {[0, 1].map((i) => <View key={i} style={styles.skeleton} />)}
      </View>
    );
  }
  return (
    <FlatList
      horizontal
      data={query.data ?? []}
      keyExtractor={(p) => p._id}
      renderItem={({ item }) => <ProductCard product={item} />}
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.row}
      ListEmptyComponent={<Text color={colors.muted}>No products yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: spacing.tabBar },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  bell: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  search: {
    marginTop: 32, height: 56, borderRadius: 9999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 8,
  },
  filter: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  hero: {
    marginTop: 32, height: 184, borderRadius: 32, overflow: 'hidden',
    shadowColor: colors.navy, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  glow: { position: 'absolute', borderRadius: 9999, backgroundColor: colors.white },
  heroText: { position: 'absolute', left: 22, top: 20, width: 214, gap: 10, alignItems: 'flex-start' },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 9999, paddingLeft: 10, paddingRight: 12, paddingVertical: 6 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, backgroundColor: colors.white, borderRadius: 9999, paddingLeft: 20, paddingRight: 18 },
  heroArt: { position: 'absolute', right: 20, top: 46, width: 104, height: 104, borderRadius: 28, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }] },
  discount: { position: 'absolute', right: 96, top: 120, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.coral, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  bleed: { marginHorizontal: -spacing.screen },
  bleedPad: { paddingHorizontal: spacing.screen },
  chips: { gap: 16, paddingHorizontal: spacing.screen, marginTop: 32 },
  row: { gap: 16, paddingHorizontal: spacing.screen, paddingVertical: 4 },
  skeleton: { width: 160, height: 239, borderRadius: 30, backgroundColor: colors.lavender },
  promo: { marginTop: 32, height: 150, borderRadius: 30, borderWidth: 1, borderColor: colors.periwinkle, overflow: 'hidden' },
  promoText: { position: 'absolute', left: 21, top: 21, width: 210, gap: 8, alignItems: 'flex-start' },
  promoPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: 9999, paddingLeft: 8, paddingRight: 10, paddingVertical: 4 },
  promoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 29, backgroundColor: colors.navy, borderRadius: 9999, paddingLeft: 18, paddingRight: 16 },
  promoArt: { position: 'absolute', right: 22, top: 30, width: 92, height: 92, borderRadius: 24, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] },
  why: { backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  whyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
});
