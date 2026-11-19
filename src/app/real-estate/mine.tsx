import { Alert, FlatList, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { errorMessage } from '@/api';
import { Screen, ScreenHeader } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { useAuth } from '@/providers/AuthProvider';
import { useEstateLocations, useEstateMutations, useMyProperties } from '@/hooks/useRealEstate';
import { PropertyCard, estateStyles, label } from '@/features/realestate/components';

export default function Mine() {
  const auth = useAuth();
  const mine = useMyProperties();
  const locations = useEstateLocations();
  const mutations = useEstateMutations();
  const busy = mutations.status.isPending || mutations.remove.isPending;
  const onError = (error: unknown) =>
    Alert.alert('Could not update property', errorMessage(error));
  if (auth.status === 'loading') return <LoadingView />;
  if (auth.status !== 'authenticated') return <Redirect href="/auth/login" />;
  return (
    <Screen scroll={false} header={<ScreenHeader title="My properties" />}>
      <FlatList
        data={mine.data?.properties ?? []}
        keyExtractor={(p) => p._id}
        refreshing={mine.isRefetching}
        onRefresh={() => mine.refetch()}
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
        ListHeaderComponent={
          <Button title="Add property" onPress={() => router.push('/real-estate/new')} />
        }
        ListEmptyComponent={
          mine.isLoading ? (
            <LoadingView />
          ) : mine.error ? (
            <ErrorView error={mine.error} onRetry={() => mine.refetch()} />
          ) : (
            <EmptyView
              title="No properties yet"
              message="Submit a property for admin review."
            />
          )
        }
        renderItem={({ item: p }) => (
          <View style={{ gap: 10 }}>
            <View style={estateStyles.chip}>
              <Text weight="bold">{label(p.status)}</Text>
            </View>
            {p.status === 'rejected' && (
              <Text color="#b42318">
                {p.rejectionReason || 'No rejection reason provided.'}
              </Text>
            )}
            <PropertyCard property={p} locations={locations.data} />
            <Button
              title="Edit"
              variant="outline"
              disabled={busy}
              onPress={() =>
                router.push({ pathname: '/real-estate/new', params: { edit: p._id } })
              }
            />
            {p.status === 'approved' && (
              <Button
                title={p.listingType === 'sale' ? 'Mark sold' : 'Mark rented'}
                disabled={busy}
                onPress={() =>
                  mutations.status.mutate(
                    {
                      id: p._id,
                      status: p.listingType === 'sale' ? 'sold' : 'rented',
                    },
                    { onError },
                  )
                }
              />
            )}
            {p.status !== 'archived' && (
              <Button
                title="Archive"
                variant="outline"
                disabled={busy}
                onPress={() =>
                  mutations.status.mutate({ id: p._id, status: 'archived' }, { onError })
                }
              />
            )}
            <Button
              title="Delete"
              variant="danger"
              disabled={busy}
              onPress={() =>
                Alert.alert('Delete property?', `Permanently delete “${p.title}”?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => mutations.remove.mutate(p._id, { onError }),
                  },
                ])
              }
            />
          </View>
        )}
      />
    </Screen>
  );
}
