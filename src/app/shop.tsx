import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search, SlidersHorizontal } from 'lucide-react-native';
import type { ProductSort } from '@/api';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Misc';
import { ProductCard } from '@/components/ProductCard';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { BrowseHeader, HeaderButton } from '@/features/browse/BrowseHeader';
import { first } from '@/features/browse/params';
import { useCategories, useProducts } from '@/hooks/queries';
import { colors, spacing } from '@/theme';

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

const GAP = 12;

export default function ShopScreen() {
  const params = useLocalSearchParams();
  const search = first(params.search);
  const featured = first(params.featured) === 'true';
  const title = first(params.title);
  const initialSort = (SORTS.find((s) => s.value === first(params.sort))?.value ?? 'newest') as ProductSort;

  const [category, setCategory] = useState(first(params.category));
  const [sort, setSort] = useState<ProductSort>(initialSort);
  const [sortOpen, setSortOpen] = useState(false);

  const categories = useCategories();
  const query = useProducts({ category, search, sort, featured: featured || undefined });
  const products = useMemo(() => query.data?.pages.flatMap((p) => p.products) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.screen * 2 - GAP) / 2;

  const heading = search ? `"${search}"` : category || title || 'Shop';
  const sortLabel = SORTS.find((s) => s.value === sort)?.label ?? 'Newest';

  const header = (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" active={!category} onPress={() => setCategory(undefined)} />
        {(categories.data ?? []).map((c) => (
          <Chip key={c._id} label={c.name} active={category === c.name} onPress={() => setCategory(c.name)} />
        ))}
      </ScrollView>
      <View style={styles.sortRow}>
        <View style={styles.inline}>
          <SlidersHorizontal size={16} color={colors.ink} />
          <Text size={14} weight="bold">{query.isLoading ? 'Loading…' : `${total} ${total === 1 ? 'result' : 'results'}`}</Text>
        </View>
        <Pressable onPress={() => setSortOpen((o) => !o)} hitSlop={10} style={styles.inline} accessibilityRole="button" accessibilityLabel={`Sort by ${sortLabel}`}>
          <Text size={14} color={colors.muted}>Sort by:</Text>
          <Text size={14} weight="bold">{sortLabel}</Text>
          <ChevronDown size={16} color={colors.ink} style={sortOpen ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </Pressable>
      </View>
      {sortOpen ? (
        <View style={styles.sortMenu}>
          {SORTS.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => { setSort(s.value); setSortOpen(false); }}
              style={styles.sortItem}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: s.value === sort }}
            >
              <Text size={15} weight={s.value === sort ? 'bold' : 'regular'} color={s.value === sort ? colors.navy : colors.ink}>{s.label}</Text>
              {s.value === sort ? <Check size={18} color={colors.navy} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <BrowseHeader
        title={heading}
        subtitle={query.isLoading ? undefined : `${total} products`}
        right={<HeaderButton label="Search" onPress={() => router.push('/search')}><Search size={22} color={colors.ink} /></HeaderButton>}
      />
      <FlatList
        data={query.error && !query.data ? [] : products}
        keyExtractor={(p) => p._id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
        refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => { query.refetch(); }} tintColor={colors.navy} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingView />
          ) : query.error ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyView
              icon={<Search size={30} color={colors.navy} />}
              title="No products found"
              message={search ? `We couldn't find anything for "${search}".` : 'Try another category or sort option.'}
              action={category ? <Button title="Show all products" variant="outline" height={48} onPress={() => setCategory(undefined)} /> : undefined}
            />
          )
        }
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.navy} style={{ marginVertical: 16 }} /> : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: spacing.screen, paddingBottom: 40, gap: 16 },
  chips: { gap: 10, paddingBottom: 4 },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortMenu: {
    marginTop: 10,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
  },
  sortItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
});
