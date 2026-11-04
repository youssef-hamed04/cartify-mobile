import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, LocateFixed, MapPinOff, Navigation, Search } from 'lucide-react-native';
import type { Locker } from '@/api';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { formatKm, lockerCoords, openDirections, sortByDistance, useUserLocation, walkMinutes } from '@/features/returns/location';
import { useLockers } from '@/hooks/queries';
import { colors, fonts, spacing } from '@/theme';

// Figma 31 · Return 5 · Find SmartBox (built from layer metadata + screenshot)
export default function LockersScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useLockers();
  const location = useUserLocation({ prompt: true });
  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lockers = (data ?? []).filter((l) => !q || `${l.name} ${l.address} ${l.city ?? ''}`.toLowerCase().includes(q));
    return sortByDistance(lockers, location.coords);
  }, [data, query, location.coords]);

  const selected = list.find((x) => x.locker._id === selectedId) ?? list[0] ?? null;

  // Frame every locker (and the user, when known) once data arrives
  useEffect(() => {
    if (!data?.length) return;
    const points = data.map(lockerCoords);
    if (location.coords) points.push(location.coords);
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(points, { edgePadding: { top: 140, right: 60, bottom: 420, left: 60 }, animated: true });
    }, 300);
    return () => clearTimeout(t);
  }, [data, location.coords]);

  const focus = (locker: Locker) => {
    setSelectedId(locker._id);
    mapRef.current?.animateToRegion({ ...lockerCoords(locker), latitudeDelta: 0.02, longitudeDelta: 0.02 }, 450);
  };

  const first = data?.[0];

  return (
    <View style={styles.flex}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation={location.status === 'granted'}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude: first?.location.lat ?? 30.0444,
          longitude: first?.location.lng ?? 31.2357,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {list.map(({ locker, km }) => {
          const active = selected?.locker._id === locker._id;
          return (
            <Marker
              key={`${locker._id}-${active ? 'on' : 'off'}`}
              coordinate={lockerCoords(locker)}
              onPress={() => focus(locker)}
              anchor={{ x: 0.5, y: active ? 0.8 : 0.5 }}
              accessibilityLabel={locker.name}
            >
              <View style={styles.markerWrap}>
                {active ? (
                  <View style={styles.pinLabel}>
                    <Text size={12} weight="bold" color={colors.navy} numberOfLines={1}>
                      {locker.name}{km != null ? ` · ${formatKm(km)}` : ''}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.halo, active ? styles.haloActive : null]}>
                  <View style={[styles.pin, active && styles.pinActive]}>
                    <Box size={active ? 28 : 20} color={active ? colors.white : colors.navy} />
                  </View>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Top bar: back + search */}
      {/* Explicit inset: a paddingTop in SafeAreaView's style would override its safe-area padding */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
        <BackButton />
        <View style={styles.search}>
          <Search size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="SmartBox near me"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search SmartBoxes"
          />
        </View>
      </View>

      {location.status === 'granted' && location.coords ? (
        <Pressable
          style={styles.locate}
          onPress={() => location.coords && mapRef.current?.animateToRegion({ ...location.coords, latitudeDelta: 0.03, longitudeDelta: 0.03 }, 450)}
          accessibilityRole="button"
          accessibilityLabel="Center on my location"
        >
          <LocateFixed size={20} color={colors.navy} />
        </Pressable>
      ) : null}

      {/* Bottom sheet */}
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text size={20} weight="bold" tracking={-0.2} accessibilityRole="header">Nearby SmartBoxes</Text>
          {data ? <Text size={14} color={colors.muted}>{list.length} found</Text> : null}
        </View>

        {location.status === 'denied' || location.status === 'unavailable' ? (
          <Pressable onPress={location.enable} style={styles.locationBanner} accessibilityRole="button">
            <MapPinOff size={18} color={colors.warning} />
            <Text size={13} color={colors.body} style={{ flex: 1 }}>
              {location.status === 'denied' ? 'Location is off, so distances are hidden.' : "Couldn't get your location."}
            </Text>
            {location.status === 'denied' ? <Text size={13} weight="bold" color={colors.indigo}>Enable</Text> : null}
          </Pressable>
        ) : null}

        {isLoading ? (
          <View style={styles.stateBox}><LoadingView label="Finding SmartBoxes" /></View>
        ) : error ? (
          <View style={styles.stateBox}><ErrorView error={error} onRetry={refetch} /></View>
        ) : !list.length ? (
          <View style={styles.stateBox}>
            <EmptyView title={query ? 'No matches' : 'No SmartBoxes yet'} message={query ? 'Try another area or name.' : 'SmartBox lockers will appear here once they are installed.'} />
          </View>
        ) : (
          <>
            <ScrollView style={styles.list} contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
              {list.map(({ locker, km }) => {
                const active = selected?.locker._id === locker._id;
                return (
                  <Pressable
                    key={locker._id}
                    onPress={() => focus(locker)}
                    style={[styles.row, active && styles.rowActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={[styles.rowIcon, active && { backgroundColor: colors.navy }]}>
                      <Box size={22} color={active ? colors.white : colors.navy} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text size={16} weight="bold" numberOfLines={1}>{locker.name}</Text>
                      <Text size={13} color={colors.muted} numberOfLines={1}>
                        {km != null ? `${formatKm(km)} · ${walkMinutes(km)} min walk · ` : `${locker.address} · `}
                        {/^24\/?7$/.test(locker.hours) ? 'Open 24/7' : locker.hours}
                      </Text>
                    </View>
                    <StatusPill locker={locker} />
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button
              title="Get directions"
              leftIcon={<Navigation size={20} color={colors.white} />}
              disabled={!selected}
              onPress={() => selected && openDirections(selected.locker)}
              style={{ marginTop: 16 }}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function StatusPill({ locker }: { locker: Locker }) {
  const pill =
    locker.status === 'maintenance' ? { label: 'Maintenance', bg: colors.border, fg: colors.body }
      : locker.status === 'busy' || locker.freeSlots === 0 ? { label: 'Busy', bg: colors.warningBg, fg: colors.warning }
        : { label: `${locker.freeSlots} free`, bg: colors.successBg, fg: colors.success };
  return (
    <View style={[styles.pill, { backgroundColor: pill.bg }]}>
      <Text size={11} weight="bold" color={pill.fg}>{pill.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lavender },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.screen, paddingTop: 12 },
  search: {
    flex: 1, height: 46, borderRadius: 23, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
    shadowColor: colors.navy, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: 0 },
  locate: {
    position: 'absolute', right: spacing.screen, bottom: 400, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.navy, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  markerWrap: { alignItems: 'center' },
  pinLabel: {
    backgroundColor: colors.white, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 6, maxWidth: 220,
    shadowColor: colors.navy, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  halo: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(92,97,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  haloActive: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(2,6,126,0.18)' },
  pin: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  pinActive: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.navy, borderWidth: 3, borderColor: colors.white },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '58%',
    backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 12,
    shadowColor: colors.navy, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: -8 }, elevation: 16,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 16 },
  locationBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.warningBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  stateBox: { minHeight: 220 },
  list: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  rowActive: { backgroundColor: colors.lavender, borderWidth: 2, borderColor: colors.indigo, padding: 15 },
  rowIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
});
