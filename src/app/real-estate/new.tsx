import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { errorMessage, type EstateProperty } from '@/api';
import { Screen, ScreenHeader } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { ErrorView, LoadingView } from '@/components/States';
import { useAuth } from '@/providers/AuthProvider';
import {
  useEstateLocations,
  useEstateMutations,
  useEstimate,
  useMyProperties,
} from '@/hooks/useRealEstate';
import { EstateFields } from '@/features/realestate/EstateFields';
import { EstimateCard, estateStyles, estimateError, label } from '@/features/realestate/components';
import {
  defaults,
  estimateSchema,
  propertySchema,
  type EstateFormValues,
} from '@/features/realestate/schemas';

export default function NewProperty() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const auth = useAuth();
  const mine = useMyProperties();
  const locations = useEstateLocations();
  const { save } = useEstateMutations();
  const estimate = useEstimate();
  const form = useForm<EstateFormValues>({
    defaultValues: defaults,
    resolver: zodResolver(propertySchema),
  });
  const listingType = useWatch({ control: form.control, name: 'listingType' });
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [existing, setExisting] = useState<EstateProperty['images']>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const loaded = useRef<string | undefined>(undefined);
  const owned = mine.data?.properties.find((p) => p._id === edit);
  useEffect(() => {
    if (edit && owned && loaded.current !== edit) {
      form.reset({ ...defaults, ...owned, contactPhone: owned.contactPhone ?? '' });
      setExisting(owned.images);
      setPhotos([]);
      setRemoved([]);
      loaded.current = edit;
    }
  }, [edit, owned, form]);
  const count = photos.length + existing.length;
  const pick = async () => {
    if (count >= 8) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 8 - count,
        quality: 0.7,
      });
      if (!result.canceled)
        setPhotos((p) => [...p, ...result.assets].slice(0, 8 - existing.length));
      setPhotoError('');
    } catch (error) {
      setPhotoError(errorMessage(error));
    }
  };
  const validateLocation = (values: EstateFormValues) => {
    const district = locations.data?.cities
      .find((c) => c.slug === values.city)
      ?.districts.find((d) => d.slug === values.district);
    if (!district) {
      form.setError('district', { message: 'Select a district in this city' });
      return false;
    }
    if (!district.views.includes(values.view)) {
      form.setError('view', { message: 'Select a view available in this district' });
      return false;
    }
    return true;
  };
  const checkPrice = () => {
    form.clearErrors();
    const values = form.getValues();
    const parsed = estimateSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        form.setError(issue.path[0] as keyof EstateFormValues, { message: issue.message }),
      );
      return;
    }
    if (validateLocation(values)) estimate.mutate(parsed.data);
  };
  const submit = form.handleSubmit(async (values) => {
    if (!validateLocation(values) || uploading) return;
    setUploading(true);
    try {
      const body = new FormData();
      Object.entries(propertySchema.parse(values)).forEach(([key, value]) =>
        body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value)),
      );
      if (edit) body.append('removeImages', JSON.stringify(removed));
      for (const [i, photo] of photos.entries()) {
        const name =
          photo.fileName ?? `property-${i}.${photo.mimeType?.split('/')[1] ?? 'jpg'}`;
        if (Platform.OS === 'web') {
          const blob = photo.file ?? (await (await fetch(photo.uri)).blob());
          body.append('images', blob, name);
        } else {
          // React Native's FormData accepts a native URI file descriptor.
          body.append(
            'images',
            { uri: photo.uri, name, type: photo.mimeType ?? 'image/jpeg' } as unknown as Blob,
          );
        }
      }
      await save.mutateAsync({ id: edit, body });
      Alert.alert('Submitted — it will appear after admin review');
      router.replace('/real-estate/mine');
    } catch (error) {
      Alert.alert('Could not submit property', errorMessage(error));
    } finally {
      setUploading(false);
    }
  });
  if (auth.status === 'loading') return <LoadingView />;
  if (auth.status !== 'authenticated') return <Redirect href="/auth/login" />;
  if (edit && mine.isLoading) return <Screen><LoadingView /></Screen>;
  if (edit && mine.error)
    return (
      <Screen>
        <ErrorView error={mine.error} onRetry={() => mine.refetch()} />
      </Screen>
    );
  if (edit && !owned)
    return (
      <Screen header={<ScreenHeader title="Edit property" />}>
        <Text>This property is not in your listings.</Text>
      </Screen>
    );
  const textFields = ['title', 'description', 'address', 'contactPhone'] as const;
  return (
    <Screen
      header={<ScreenHeader title={edit ? 'Edit property' : 'Add property'} />}
      contentStyle={estateStyles.stack}
    >
      {locations.isLoading ? (
        <LoadingView />
      ) : locations.error ? (
        <ErrorView error={locations.error} onRetry={() => locations.refetch()} />
      ) : (
        locations.data && (
          <>
            <Text>
              All submissions and edits are reviewed by an admin before appearing publicly.
            </Text>
            {textFields.map((name) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    label={name === 'contactPhone' ? 'Contact phone' : label(name)}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    multiline={name === 'description'}
                    keyboardType={name === 'contactPhone' ? 'phone-pad' : 'default'}
                  />
                )}
              />
            ))}
            <EstateFields form={form} locations={locations.data} />
            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  label={`Asking price (EGP${listingType === 'rent' ? ' / month' : ''})`}
                  keyboardType="decimal-pad"
                  value={Number.isNaN(field.value) ? '' : String(field.value)}
                  onChangeText={(v) => field.onChange(v.trim() === '' ? NaN : Number(v))}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Text weight="bold">Amenities</Text>
            <Controller
              name="amenities"
              control={form.control}
              render={({ field }) => (
                <View style={estateStyles.row}>
                  {locations.data!.amenities.map((a) => (
                    <Button
                      key={a}
                      title={`${field.value.includes(a) ? 'Selected: ' : ''}${label(a)}`}
                      height={48}
                      variant={field.value.includes(a) ? 'primary' : 'outline'}
                      onPress={() =>
                        field.onChange(
                          field.value.includes(a)
                            ? field.value.filter((v) => v !== a)
                            : [...field.value, a],
                        )
                      }
                    />
                  ))}
                </View>
              )}
            />
            <Button
              title="Check market price"
              variant="outline"
              loading={estimate.isPending}
              onPress={checkPrice}
            />
            {estimate.error && (
              <Text accessibilityRole="alert" color="#b42318">
                {estimateError(estimate.error)}
              </Text>
            )}
            {estimate.data && (
              <EstimateCard
                estimate={estimate.data.estimate}
                rent={estimate.variables?.listingType === 'rent'}
                dataNote={locations.data.dataNote}
              />
            )}
            <Text weight="bold">
              Photos ({count}/8)
            </Text>
            {existing.map((photo, index) => (
              <View key={photo.publicId || `${photo.url}-${index}`} style={estateStyles.card}>
                <Image
                  source={{ uri: photo.url }}
                  accessibilityLabel="Existing property photo"
                  style={estateStyles.image}
                />
                <Button
                  title="Remove photo"
                  variant="danger"
                  onPress={() => {
                    setExisting((v) => v.filter((i) => i !== photo));
                    // Only Cloudinary photos (with a publicId) can be deleted on the server
                    const { publicId } = photo;
                    if (publicId) setRemoved((v) => [...v, publicId]);
                  }}
                />
              </View>
            ))}
            {photos.map((photo, index) => (
              <View key={`${photo.uri}-${index}`} style={estateStyles.card}>
                <Image
                  source={{ uri: photo.uri }}
                  accessibilityLabel={`Selected property photo ${index + 1}`}
                  style={estateStyles.image}
                />
                <Button
                  title={`Remove photo ${index + 1}`}
                  variant="danger"
                  onPress={() => setPhotos((v) => v.filter((_, i) => i !== index))}
                />
              </View>
            ))}
            {photoError ? <Text color="#b42318">{photoError}</Text> : null}
            <Button
              title="Choose photos"
              variant="outline"
              disabled={count >= 8 || uploading}
              onPress={pick}
            />
            <Button title="Submit for review" loading={uploading} onPress={submit} />
          </>
        )
      )}
    </Screen>
  );
}
