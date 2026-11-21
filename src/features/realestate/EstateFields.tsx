import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { Switch, View } from 'react-native';
import type { EstateLocations } from '@/api';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { Choice, ListingSwitch, LocationPickers, options } from './components';
import type { EstateFormValues } from './schemas';

export function EstateFields({
  form,
  locations,
}: {
  form: UseFormReturn<EstateFormValues>;
  locations: EstateLocations;
}) {
  const {
    control,
    setValue,
    formState: { errors },
  } = form;
  const [city, district, listingType] = useWatch({
    control,
    name: ['city', 'district', 'listingType'],
  });
  const views =
    locations.cities.find((c) => c.slug === city)?.districts.find((d) => d.slug === district)
      ?.views ?? [];
  return (
    <>
      <ListingSwitch
        value={listingType}
        onChange={(v) => {
          setValue('listingType', v);
          if (v === 'sale') setValue('furnished', false);
        }}
      />
      <LocationPickers
        data={locations}
        city={city}
        district={district}
        onChange={(c, d) => {
          setValue('city', c, { shouldValidate: true });
          setValue('district', d, { shouldValidate: true });
          const allowed =
            locations.cities.find((v) => v.slug === c)?.districts.find((v) => v.slug === d)
              ?.views ?? [];
          setValue('view', allowed[0] ?? 'street');
        }}
      />
      {errors.city && <Text color="#b42318">{errors.city.message}</Text>}
      {errors.district && <Text color="#b42318">{errors.district.message}</Text>}
      <Controller
        control={control}
        name="propertyType"
        render={({ field }) => (
          <Choice
            title="Property type"
            value={field.value}
            options={options(locations.propertyTypes)}
            onChange={field.onChange}
          />
        )}
      />
      {(['area', 'rooms', 'bathrooms', 'floor', 'buildingAge'] as const).map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <TextField
              label={
                ({
                  area: 'Area (m²)',
                  rooms: 'Rooms',
                  bathrooms: 'Bathrooms',
                  floor: 'Floor (ground = 0)',
                  buildingAge: 'Building age (years)',
                })[name]
              }
              keyboardType={name === 'floor' ? 'numbers-and-punctuation' : 'decimal-pad'}
              value={Number.isNaN(field.value) ? '' : String(field.value)}
              onBlur={field.onBlur}
              onChangeText={(v) => field.onChange(v.trim() === '' ? NaN : Number(v))}
              error={fieldState.error?.message}
            />
          )}
        />
      ))}
      <Controller
        control={control}
        name="hasElevator"
        render={({ field }) => (
          <View
            style={{
              minHeight: 44,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text>Elevator</Text>
            <Switch
              accessibilityLabel="Elevator"
              value={field.value}
              onValueChange={field.onChange}
            />
          </View>
        )}
      />
      <Controller
        control={control}
        name="finishing"
        render={({ field }) => (
          <Choice
            title="Finishing"
            value={field.value}
            options={options(locations.finishing)}
            onChange={field.onChange}
          />
        )}
      />
      {listingType === 'rent' && (
        <Controller
          control={control}
          name="furnished"
          render={({ field }) => (
            <View
              style={{
                minHeight: 44,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text>Furnished</Text>
              <Switch
                accessibilityLabel="Furnished"
                value={field.value}
                onValueChange={field.onChange}
              />
            </View>
          )}
        />
      )}
      <Controller
        control={control}
        name="view"
        render={({ field }) => (
          <Choice
            title="View"
            value={field.value}
            options={options(views)}
            onChange={field.onChange}
          />
        )}
      />
      {errors.view && <Text color="#b42318">{errors.view.message}</Text>}
    </>
  );
}
