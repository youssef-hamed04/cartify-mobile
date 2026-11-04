import { createElement } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { productsApi, type Category } from '@/api';
import { Text } from '@/components/Text';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { BrowseHeader, HeaderButton } from '@/features/browse/BrowseHeader';
import { useCategories } from '@/hooks/queries';
import { categoryIcon } from '@/lib/categoryIcon';
import { productImage } from '@/lib/format';
import { colors, spacing } from '@/theme';

// Gradients behind each tile image, cycled as in the design
const TILE_GRADIENTS: [string, string][] = [
  ['#4338ca', colors.periwinkle],
  ['#312e81', '#8b8fff'],
  [colors.navyDeep, colors.indigoBright],
  [colors.navy, colors.indigoBright],
];

export default function CategoriesScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useCategories();

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <BrowseHeader
        title="Categories"
        back={false}
        right={<HeaderButton label="Search" onPress={() => router.push('/search')}><Search size={22} color={colors.ink} /></HeaderButton>}
      />
      {isLoading ? (
        <LoadingView />
      ) : error && !data ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.navy} />}
          renderItem={({ item, index }) => <CategoryTile category={item} index={index} />}
          ListEmptyComponent={<EmptyView title="No categories yet" message="Check back soon for new collections." />}
        />
      )}
    </SafeAreaView>
  );
}

// Categories have no image in the backend, so the tile shows the first product photo of that category
function CategoryTile({ category, index }: { category: Category; index: number }) {
  const cover = useQuery({
    queryKey: ['categoryCover', category.name],
    queryFn: () => productsApi.list({ category: category.name, limit: 1, sort: 'rating' }).then((r) => productImage(r.products[0])),
    enabled: !category.image?.url,
    staleTime: 10 * 60_000,
  });
  const uri = category.image?.url || cover.data;
  const gradient = TILE_GRADIENTS[index % TILE_GRADIENTS.length];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/shop', params: { category: category.name } })}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${category.productCount} products`}
    >
      <LinearGradient colors={gradient} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.image}>
        {uri ? (
          <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          createElement(categoryIcon(category.name), { size: 40, color: colors.white, strokeWidth: 1.8 })
        )}
        <View pointerEvents="none" style={styles.glow} />
      </LinearGradient>
      <View style={styles.info}>
        <Text size={17} weight="bold" numberOfLines={1}>{category.name}</Text>
        <Text size={13} color={colors.muted}>{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: spacing.tabBar, gap: 16 },
  row: { gap: 16 },
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    padding: 12,
    gap: 12,
    shadowColor: colors.navy,
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  image: { height: 92, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 126, height: 126, borderRadius: 63, right: -60, top: -49, backgroundColor: colors.white, opacity: 0.12 },
  info: { paddingHorizontal: 4, paddingBottom: 4, gap: 2 },
});
