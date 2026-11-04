import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, Flame, Plus, Search, Star, X } from 'lucide-react-native';
import { productsApi, type Product } from '@/api';
import { IconButton } from '@/components/Button';
import { goBack } from '@/components/Screen';
import { Text } from '@/components/Text';
import { EmptyView, ErrorView } from '@/components/States';
import { useAddToCart, useCategories } from '@/hooks/queries';
import { money, productImage } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { colors, fonts, spacing } from '@/theme';

// Recent searches live in memory for this app session only
let recentSearches: string[] = [];
const remember = (term: string) => {
  recentSearches = [term, ...recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
};

export default function SearchScreen() {
  const [text, setText] = useState('');
  const [term, setTerm] = useState('');
  const [recent, setRecent] = useState(recentSearches);
  const categories = useCategories();

  useEffect(() => {
    const t = setTimeout(() => setTerm(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  const results = useQuery({
    queryKey: ['search', term],
    queryFn: () => productsApi.list({ search: term, limit: 20 }),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  });

  const openAll = (q: string) => {
    if (!q) return;
    remember(q);
    setRecent(recentSearches);
    Keyboard.dismiss();
    router.push({ pathname: '/shop', params: { search: q } });
  };

  const openProduct = (p: Product) => {
    if (term) { remember(term); setRecent(recentSearches); }
    router.push(`/product/${p._id}`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <View style={styles.header}>
        <IconButton label="Go back" onPress={goBack} size={46} bordered>
          <ChevronLeft size={22} color={colors.ink} />
        </IconButton>
        <View style={styles.field}>
          <Search size={20} color={colors.muted} />
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            placeholder="Search products..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            onSubmitEditing={() => openAll(text.trim())}
            autoCorrect={false}
            style={styles.input}
            accessibilityLabel="Search products"
          />
          {text ? (
            <Pressable onPress={() => setText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <X size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {term ? (
        <FlatList
          data={results.data?.products ?? []}
          keyExtractor={(p) => p._id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            results.data?.products.length ? (
              <View style={styles.sectionRow}>
                <Text size={18} weight="bold">{results.data.total === 1 ? 'Top result' : `${results.data.total} results`}</Text>
                {results.data.total > results.data.products.length ? (
                  <Pressable onPress={() => openAll(term)} hitSlop={10}><Text size={14} weight="bold" color={colors.indigo}>See all</Text></Pressable>
                ) : null}
              </View>
            ) : undefined
          }
          renderItem={({ item }) => <ResultRow product={item} onPress={() => openProduct(item)} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            results.isFetching ? (
              <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />
            ) : results.error ? (
              <ErrorView error={results.error} onRetry={() => results.refetch()} />
            ) : (
              <EmptyView icon={<Search size={30} color={colors.navy} />} title="No results" message={`Nothing matches "${term}". Try a different word.`} />
            )
          }
        />
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(t) => t}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            recent.length ? (
              <View style={styles.sectionRow}>
                <Text size={18} weight="bold">Recent searches</Text>
                <Pressable onPress={() => { recentSearches = []; setRecent([]); }} hitSlop={10} accessibilityRole="button">
                  <Text size={14} weight="bold" color={colors.indigo}>Clear all</Text>
                </Pressable>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setText(item)} style={styles.recent} accessibilityRole="button" accessibilityLabel={`Search ${item}`}>
              <View style={styles.recentIcon}><Clock size={18} color={colors.navy} /></View>
              <Text size={15} weight="medium" style={{ flex: 1 }} numberOfLines={1}>{item}</Text>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          )}
          ListFooterComponent={
            <View style={{ marginTop: recent.length ? 28 : 8 }}>
              <Text size={18} weight="bold" style={{ marginBottom: 14 }}>Browse categories</Text>
              <View style={styles.chips}>
                {(categories.data ?? []).map((c) => (
                  <Pressable
                    key={c._id}
                    onPress={() => router.push({ pathname: '/shop', params: { category: c.name } })}
                    style={styles.trend}
                    accessibilityRole="button"
                  >
                    <Flame size={14} color={colors.coral} />
                    <Text size={14} weight="semibold">{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ResultRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const addToCart = useAddToCart();
  const toast = useToast();
  const inStock = product.variants.find((v) => v.stock - v.reserved > 0);
  const onAdd = () => {
    if (!inStock) return toast.show('Out of stock', 'error');
    if (product.variants.length > 1) return onPress();
    addToCart.mutate(
      { productId: product._id, color: inStock.color },
      { onSuccess: () => toast.show(`${product.name} added to cart`), onError: (e) => toast.show(e.message, 'error') },
    );
  };
  return (
    <Pressable onPress={onPress} style={styles.result} accessibilityRole="button" accessibilityLabel={`${product.name}, ${money(product.finalPrice)}`}>
      <View style={styles.resultImage}>
        <Image source={productImage(product)} style={StyleSheet.absoluteFill} contentFit="cover" />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text size={15} weight="bold" numberOfLines={2}>{product.name}</Text>
        <View style={styles.inline}>
          <Star size={13} color={colors.star} fill={colors.star} />
          <Text size={13} color={colors.muted}>{product.rating.average.toFixed(1)} · ({product.rating.count.toLocaleString('en-US')})</Text>
        </View>
        <Text size={18} weight="bold" color={colors.navy}>{money(product.finalPrice)}</Text>
      </View>
      <Pressable
        onPress={onAdd}
        disabled={addToCart.isPending}
        style={[styles.add, addToCart.isPending && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name} to cart`}
      >
        <Plus size={18} color={colors.white} strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 16 },
  field: {
    flex: 1, height: 52, borderRadius: 9999, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.indigo,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18,
  },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink, paddingVertical: 0 },
  content: { paddingHorizontal: spacing.screen, paddingBottom: 40 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 48, marginBottom: 6 },
  recentIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, borderRadius: 9999, paddingHorizontal: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, backgroundColor: colors.white, borderRadius: 26, borderWidth: 1, borderColor: colors.border },
  resultImage: { width: 76, height: 76, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.lavender },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  add: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
