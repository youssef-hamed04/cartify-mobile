import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import type { EstateQuery } from '@/api';
import { Screen, ScreenHeader } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { useEstateLocations, useProperties } from '@/hooks/useRealEstate';
import {
  Choice,
  ListingSwitch,
  LocationPickers,
  PropertyCard,
  estateStyles,
  options,
} from '@/features/realestate/components';

export default function Properties() {
  const [query, setQuery] = useState<EstateQuery>({
    listingType: 'sale',
    sort: 'newest',
    page: 1,
    limit: 12,
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(false);
  const locations = useEstateLocations();
  const list = useProperties(query);
  useEffect(() => {
    const timer = setTimeout(() => setQuery((q) => ({ ...q, q: search, page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const change = (patch: Partial<EstateQuery>) => setQuery((q) => ({ ...q, ...patch, page: 1 }));
  const invalidRange =
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice;
  const quickLinks = [
    { title: 'Estimate price', path: '/real-estate/estimate' },
    { title: 'Add property', path: '/real-estate/new' },
    { title: 'My properties', path: '/real-estate/mine' },
  ] as const;
  const numberFields = ['minPrice', 'maxPrice', 'rooms'] as const;
  const numberFieldLabels = {
    minPrice: 'Minimum price (EGP)',
    maxPrice: 'Maximum price (EGP)',
    rooms: 'Minimum rooms',
  } as const;
  return (
    <Screen
      scroll={false}
      header={<ScreenHeader title="Real Estate" subtitle="Dakahlia · الدقهلية" />}
    >
      <FlatList
        data={invalidRange || list.error ? [] : (list.data?.properties ?? [])}
        keyExtractor={(p) => p._id}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshing={list.isRefetching}
        onRefresh={() => {
          void list.refetch();
          void locations.refetch();
        }}
        renderItem={({ item }) => <PropertyCard property={item} locations={locations.data} />}
        ListHeaderComponent={
          <View style={estateStyles.stack}>
            <ListingSwitch
              value={query.listingType!}
              onChange={(listingType) => change({ listingType })}
            />
            <View style={estateStyles.row}>
              {quickLinks.map((item) => (
                <Button
                  key={item.path}
                  title={item.title}
                  variant="outline"
                  height={48}
                  onPress={() => router.push(item.path)}
                />
              ))}
            </View>
            <TextField
              placeholder="Search properties"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            <Button
              title={filters ? 'Hide filters' : 'Filter & sort'}
              variant="outline"
              onPress={() => setFilters(!filters)}
            />
            {locations.isLoading ? (
              <LoadingView label="Loading locations" />
            ) : locations.error ? (
              <ErrorView error={locations.error} onRetry={() => locations.refetch()} />
            ) : null}
            {filters && locations.data && (
              <View style={estateStyles.card}>
                <LocationPickers
                  all
                  data={locations.data}
                  city={query.city ?? ''}
                  district={query.district ?? ''}
                  onChange={(city, district) => change({ city, district })}
                />
                <Choice
                  title="Property type"
                  value={query.propertyType ?? ''}
                  options={[
                    { value: '', label: 'All types' },
                    ...options(locations.data.propertyTypes),
                  ]}
                  onChange={(v) =>
                    change({ propertyType: v ? (v as EstateQuery['propertyType']) : undefined })
                  }
                />
                {numberFields.map((key) => (
                  <TextField
                    key={key}
                    label={numberFieldLabels[key]}
                    keyboardType="number-pad"
                    value={query[key] === undefined ? '' : String(query[key])}
                    onChangeText={(v) => {
                      if (/^\d*$/.test(v))
                        change({ [key]: v === '' ? undefined : Number(v) });
                    }}
                  />
                ))}
                {invalidRange && (
                  <Text color="#b42318">
                    Maximum price must be at least the minimum price.
                  </Text>
                )}
                <Choice
                  title="Sort"
                  value={query.sort!}
                  options={options([
                    'newest',
                    'price_asc',
                    'price_desc',
                    'area_desc',
                    'best_deal',
                  ])}
                  onChange={(v) => change({ sort: v as EstateQuery['sort'] })}
                />
                <Button
                  title="Reset filters"
                  variant="outline"
                  onPress={() => {
                    setSearch('');
                    setQuery({
                      listingType: query.listingType,
                      page: 1,
                      limit: 12,
                      sort: 'newest',
                    });
                  }}
                />
              </View>
            )}
            <Text color="#666">
              {list.data?.total ?? 0} properties
              {query.listingType === 'rent' ? ' · Prices per month' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          list.isLoading ? (
            <LoadingView />
          ) : list.error ? (
            <ErrorView error={list.error} onRetry={() => list.refetch()} />
          ) : (
            <EmptyView
              title={invalidRange ? 'Check your price range' : 'No properties found'}
              message="Try another district or adjust your filters."
            />
          )
        }
        ListFooterComponent={
          list.data && list.data.pages > 1 ? (
            <View style={estateStyles.stack}>
              <Text align="center">
                Page {list.data.page} of {list.data.pages}
              </Text>
              <Button
                title="Previous"
                disabled={(query.page ?? 1) <= 1 || list.isFetching}
                onPress={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}
              />
              <Button
                title="Next"
                disabled={(query.page ?? 1) >= list.data.pages || list.isFetching}
                onPress={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}
              />
            </View>
          ) : undefined
        }
      />
    </Screen>
  );
}
