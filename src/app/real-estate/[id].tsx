import { useState } from 'react';
import { Alert, FlatList, Image, Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { errorMessage } from '@/api';
import { Screen, ScreenHeader } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { ErrorView, LoadingView } from '@/components/States';
import { useAuth } from '@/providers/AuthProvider';
import { useEstateLocations, useProperties, useProperty } from '@/hooks/useRealEstate';
import {
  EstimateCard,
  PropertyCard,
  estateStyles,
  label,
  locationName,
  money,
} from '@/features/realestate/components';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useProperty(id);
  const locations = useEstateLocations();
  const { status } = useAuth();
  const p = detail.data?.property;
  const similar = useProperties(
    {
      listingType: p?.listingType,
      city: p?.city,
      district: p?.district,
      propertyType: p?.propertyType,
      limit: 6,
    },
    !!p,
  );
  const [width, setWidth] = useState(0);
  return (
    <Screen header={<ScreenHeader title="Property details" />} contentStyle={estateStyles.stack}>
      {detail.isLoading ? (
        <LoadingView />
      ) : detail.error ? (
        <ErrorView error={detail.error} onRetry={() => detail.refetch()} />
      ) : (
        p && (
          <>
            <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
              {p.images.length ? (
                <FlatList
                  key={width}
                  horizontal
                  pagingEnabled
                  data={p.images}
                  keyExtractor={(item) => item.publicId}
                  renderItem={({ item, index }) => (
                    <Image
                      accessibilityLabel={`${p.title}, photo ${index + 1} of ${p.images.length}`}
                      source={{ uri: item.url }}
                      style={{ width, height: 260, borderRadius: 20 }}
                    />
                  )}
                />
              ) : (
                <Text>No photos available</Text>
              )}
            </View>
            {p.images.length > 1 && <Text>Swipe to view all {p.images.length} photos</Text>}
            <Text size={24} weight="bold">
              {p.title}
            </Text>
            <Text size={24} weight="bold">
              {money(p.price)}
              {p.listingType === 'rent' ? ' / month' : ''}
            </Text>
            <Text>{locationName(p, locations.data)}</Text>
            <Text>{p.address}</Text>
            <View style={estateStyles.card}>
              <Text>
                {label(p.propertyType)} · For {p.listingType}
              </Text>
              <Text>
                {p.area} m² · {p.rooms} rooms · {p.bathrooms} baths
              </Text>
              <Text>
                Floor {p.floor} · {p.hasElevator ? 'Elevator' : 'No elevator'}
              </Text>
              <Text>Building age: {p.buildingAge} years</Text>
              <Text>
                {label(p.finishing)} finishing · {label(p.view)} view
              </Text>
              {p.listingType === 'rent' && (
                <Text>{p.furnished ? 'Furnished' : 'Unfurnished'}</Text>
              )}
            </View>
            <Text size={18} weight="bold">
              Amenities
            </Text>
            <Text>
              {p.amenities.length ? p.amenities.map(label).join(' · ') : 'No amenities listed'}
            </Text>
            <Text size={18} weight="bold">
              Description
            </Text>
            <Text>{p.description}</Text>
            {p.estimate ? (
              <EstimateCard
                estimate={p.estimate}
                rent={p.listingType === 'rent'}
                dataNote={locations.data?.dataNote}
              />
            ) : (
              <Text>Price estimate currently unavailable.</Text>
            )}
            {locations.error && (
              <ErrorView error={locations.error} onRetry={() => locations.refetch()} />
            )}
            <Text>
              Listed by {[p.owner.firstName, p.owner.lastName].filter(Boolean).join(' ')}
            </Text>
            {status === 'authenticated' ? (
              p.contactPhone && !p.contactHidden ? (
                <Button
                  title={`Call ${p.contactPhone}`}
                  onPress={() =>
                    Linking.openURL(`tel:${p.contactPhone!.replace(/[^+\d]/g, '')}`).catch((err) =>
                      Alert.alert('Unable to call', errorMessage(err)),
                    )
                  }
                />
              ) : (
                <Text>Contact phone is unavailable.</Text>
              )
            ) : (
              <Button title="Log in to see the phone" onPress={() => router.push('/auth/login')} />
            )}
            <Text size={18} weight="bold">
              Similar properties
            </Text>
            {similar.isLoading ? (
              <LoadingView />
            ) : similar.error ? (
              <ErrorView error={similar.error} onRetry={() => similar.refetch()} />
            ) : (
              <FlatList
                horizontal
                data={similar.data?.properties.filter((v) => v._id !== p._id) ?? []}
                keyExtractor={(v) => v._id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                  <View style={{ width: 280 }}>
                    <PropertyCard property={item} locations={locations.data} />
                  </View>
                )}
                ListEmptyComponent={<Text>No similar properties yet.</Text>}
              />
            )}
          </>
        )
      )}
    </Screen>
  );
}
