import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { type EstateLocations, type EstateProperty, type PriceEstimate, ApiError, errorMessage } from '@/api';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { colors } from '@/theme';

export const money = (value: number) =>
  new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value);

export const label = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

export const estateStyles = StyleSheet.create({
  stack: { gap: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  image: {
    height: 190,
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.lavender,
  },
});

export function Choice({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value)?.label ?? 'Select';
  return (
    <View style={{ gap: 6 }}>
      <Text size={13} weight="semibold">
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${selected}`}
        style={estateStyles.chip}
        onPress={() => setOpen(true)}
      >
        <Text>
          {selected} ▾
        </Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
          <View accessibilityViewIsModal style={[estateStyles.card, { maxHeight: '80%' }]}>
            <Text size={20} weight="bold">
              {title}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: option.value === value }}
                  style={estateStyles.chip}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Text>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="Close" variant="outline" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: label(value) }));

export function ListingSwitch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: 'sale' | 'rent') => void;
}) {
  return (
    <View style={estateStyles.row}>
      {(['sale', 'rent'] as const).map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option }}
          style={[
            estateStyles.chip,
            {
              flex: 1,
              backgroundColor: value === option ? colors.navy : colors.white,
            },
          ]}
          onPress={() => onChange(option)}
        >
          <Text
            align="center"
            weight="bold"
            color={value === option ? colors.white : colors.navy}
          >
            {label(option)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function LocationPickers({
  data,
  city,
  district,
  onChange,
  all = false,
}: {
  data: EstateLocations;
  city: string;
  district: string;
  onChange: (city: string, district: string) => void;
  all?: boolean;
}) {
  const any = all ? [{ value: '', label: 'All' }] : [];
  const bilingual = (value: { slug: string; nameEn: string; nameAr: string }) => ({
    value: value.slug,
    label: `${value.nameEn} · ${value.nameAr}`,
  });
  const districtOptions = data.cities.find((c) => c.slug === city)?.districts ?? [];
  return (
    <>
      <Choice
        title="City"
        value={city}
        options={[...any, ...data.cities.map(bilingual)]}
        onChange={(v) => onChange(v, '')}
      />
      <Choice
        title="District"
        value={district}
        options={[...any, ...districtOptions.map(bilingual)]}
        onChange={(v) => onChange(city, v)}
      />
    </>
  );
}

export function locationName(p: { city: string; district: string }, data?: EstateLocations) {
  const city = data?.cities.find((c) => c.slug === p.city);
  const district = city?.districts.find((d) => d.slug === p.district);
  const districtName = district ? `${district.nameEn} · ${district.nameAr}` : p.district;
  const cityName = city ? `${city.nameEn} · ${city.nameAr}` : p.city;
  return `${districtName}, ${cityName}`;
}

export function VerdictBadge({ verdict }: { verdict?: PriceEstimate['verdict'] }) {
  if (!verdict) return null;
  return (
    <Text weight="semibold" color={verdict === 'above_market' ? colors.danger : colors.navy}>
      {({ below_market: 'Good deal', fair: 'Fair price', above_market: 'Above market' })[verdict]}
    </Text>
  );
}

export function PropertyCard({
  property: p,
  locations,
}: {
  property: EstateProperty;
  locations?: EstateLocations;
}) {
  return (
    <Pressable
      style={estateStyles.card}
      accessibilityRole="button"
      accessibilityLabel={`${p.title}, ${money(p.price)}${p.listingType === 'rent' ? ' per month' : ''}`}
      onPress={() =>
        router.push({ pathname: '/real-estate/[id]', params: { id: p._id } })
      }
    >
      {p.images[0] ? (
        <Image
          source={{ uri: p.images[0].url }}
          accessibilityLabel={`Photo of ${p.title}`}
          style={estateStyles.image}
        />
      ) : (
        <View style={[estateStyles.image, { justifyContent: 'center' }]}>
          <Text align="center">No photo available</Text>
        </View>
      )}
      <Text size={20} weight="bold">
        {money(p.price)}
        {p.listingType === 'rent' ? ' / month' : ''}
      </Text>
      <Text weight="semibold">{p.title}</Text>
      <Text>
        {p.area} m² · {p.rooms} rooms · {p.bathrooms} baths
      </Text>
      <Text color={colors.muted}>{locationName(p, locations)}</Text>
      <VerdictBadge verdict={p.estimate?.verdict} />
    </Pressable>
  );
}

export function EstimateCard({
  estimate: e,
  rent,
  dataNote,
}: {
  estimate: PriceEstimate;
  rent: boolean;
  dataNote?: string;
}) {
  return (
    <View style={estateStyles.card}>
      <Text size={18} weight="bold">
        Our estimate
      </Text>
      <Text size={24} weight="bold" color={colors.navy}>
        {money(e.price)}
        {rent ? ' / month' : ''}
      </Text>
      <Text>
        Range: {money(e.low)} – {money(e.high)}
        {rent ? ' / month' : ''}
      </Text>
      <Text>
        {money(e.pricePerM2)} / m²
        {rent ? ' / month' : ''}
      </Text>
      <VerdictBadge verdict={e.verdict} />
      {e.diffPercent !== undefined && (
        <Text>
          {Math.abs(e.diffPercent).toFixed(1)}%{' '}
          {e.verdict === 'below_market'
            ? 'below'
            : e.verdict === 'above_market'
              ? 'above'
              : 'difference from'}{' '}
          estimated market price
        </Text>
      )}
      <Text color={colors.muted}>
        {e.method === 'ml' ? 'Machine-learning estimate' : 'Comparable-property estimate'}
        {e.comparablesCount !== undefined ? ` · ${e.comparablesCount} comparables` : ''}. Estimates
        are indicative, not a valuation.
      </Text>
      {dataNote ? (
        <Text size={12} color={colors.muted}>
          {dataNote}
        </Text>
      ) : null}
    </View>
  );
}

export function estimateError(error: unknown) {
  return error instanceof ApiError && error.status === 429
    ? 'Too many estimates. Please wait a little before trying again.'
    : errorMessage(error);
}
