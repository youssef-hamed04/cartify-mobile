import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Box, ChevronRight, MapPin, Package } from 'lucide-react-native';
import type { ReturnRequest } from '@/api';
import { Pill, SectionHeader } from '@/components/Misc';
import { Screen } from '@/components/Screen';
import { ErrorView } from '@/components/States';
import { Text } from '@/components/Text';
import { formatKm, sortByDistance, useUserLocation } from '@/features/returns/location';
import { isActiveReturn, returnOrderRef, returnTitle } from '@/features/returns/utils';
import { useLockers, useReturns } from '@/hooks/queries';
import { dateTime, returnStatusLabel, shortDate } from '@/lib/format';
import { colors, heroGradient, spacing } from '@/theme';

const STEPS = [
  { title: 'Request a return', text: 'Pick the item and tell us why.' },
  { title: 'Get your code', text: 'A Locker ID, unlock code and QR appear instantly.' },
  { title: 'Drop at a SmartBox', text: 'Type the code on the keypad and place the item inside.' },
  { title: 'We take it from there', text: 'The box confirms the drop-off and our team reviews your refund.' },
];

const statusColors: Record<ReturnRequest['status'], { bg: string; fg: string }> = {
  pending: { bg: colors.warningBg, fg: colors.ink },
  completed: { bg: colors.successBg, fg: colors.success },
  expired: { bg: colors.border, fg: colors.body },
  denied: { bg: colors.dangerBg, fg: colors.danger },
};

// Figma 26 · Returns Hub (+ 25 · Smart Returns when there is no active return)
export default function ReturnsScreen() {
  const returns = useReturns();
  const lockers = useLockers();
  const location = useUserLocation({ prompt: false }); // only uses an already-granted permission
  const [refreshing, setRefreshing] = useState(false);

  const active = (returns.data ?? []).filter(isActiveReturn);
  const past = (returns.data ?? []).filter((r) => !isActiveReturn(r));
  const nearest = useMemo(() => sortByDistance(lockers.data ?? [], location.coords)[0] ?? null, [lockers.data, location.coords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([returns.refetch(), lockers.refetch()]);
    setRefreshing(false);
  }, [returns, lockers]);

  return (
    <Screen
      contentStyle={{ paddingTop: 12, paddingBottom: spacing.tabBar }}
      scrollProps={{ refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} /> }}
    >
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text size={30} weight="bold" tracking={-0.6} accessibilityRole="header">Smart Returns</Text>
          <Text size={15} color={colors.muted}>Drop it. Done.</Text>
        </View>
        <Pressable onPress={() => router.push('/lockers')} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Find a SmartBox">
          <MapPin size={22} color={colors.ink} />
        </Pressable>
      </View>

      <LinearGradient {...heroGradient} end={{ x: 0.6, y: 1 }} style={styles.hero}>
        <View style={[styles.glow, { width: 220, height: 220, left: 200, top: -80 }]} />
        <View style={styles.heroText}>
          <Text size={27} weight="bold" color={colors.white} lineHeight={31} tracking={-0.54}>Return anything.{'\n'}Anytime.</Text>
          <Pressable onPress={() => router.push('/return/select')} style={styles.heroBtn} accessibilityRole="button">
            <Text size={14} weight="bold" color={colors.navy}>Start a return</Text>
            <ArrowRight size={16} color={colors.navy} />
          </Pressable>
        </View>
        <LinearGradient colors={[colors.periwinkle, colors.indigo]} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroArt}>
          <Box size={46} color={colors.white} strokeWidth={1.8} />
        </LinearGradient>
      </LinearGradient>

      {returns.error && !returns.data ? (
        <ErrorView error={returns.error} onRetry={returns.refetch} />
      ) : active.length ? (
        <>
          <SectionHeader title={active.length > 1 ? 'Active returns' : 'Active return'} />
          <View style={{ gap: 14 }}>{active.map((r) => <ActiveReturnCard key={r._id} rr={r} />)}</View>
        </>
      ) : null}

      <SectionHeader title="How it works" />
      <View style={[styles.card, { padding: 22, gap: 22 }]}>
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.stepNum}><Text size={16} weight="bold" color={colors.navy}>{i + 1}</Text></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text size={16} weight="bold">{s.title}</Text>
              <Text size={14} color={colors.body} lineHeight={19}>{s.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {nearest ? (
        <Pressable onPress={() => router.push('/lockers')} style={[styles.card, styles.nearest]} accessibilityRole="button">
          <View style={styles.pinCircle}><MapPin size={24} color={colors.white} /></View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text size={16} weight="bold" numberOfLines={1}>{nearest.locker.name}</Text>
            <Text size={13} color={colors.muted} numberOfLines={1}>
              {nearest.km != null ? `${formatKm(nearest.km)} away` : nearest.locker.address}
              {' · '}{/^24\/?7$/.test(nearest.locker.hours) ? 'Open 24/7' : nearest.locker.hours}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.ink} />
        </Pressable>
      ) : null}

      {past.length ? (
        <>
          <SectionHeader title="Past returns" />
          <View style={{ gap: 12 }}>
            {past.map((r) => (
              <Pressable key={r._id} onPress={() => router.push(`/return/${r._id}`)} style={[styles.card, styles.pastRow]} accessibilityRole="button">
                <View style={{ flex: 1, gap: 3 }}>
                  <Text size={15} weight="bold" numberOfLines={1}>{returnTitle(r)}</Text>
                  <Text size={13} color={colors.muted}>{returnOrderRef(r)} · {shortDate(r.createdAt)}</Text>
                </View>
                <Pill label={returnStatusLabel[r.status]} background={statusColors[r.status].bg} color={statusColors[r.status].fg} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

// Pending return: requested → code ready → dropped at box. A pending one is at step 2 of 3.
function ActiveReturnCard({ rr }: { rr: ReturnRequest }) {
  return (
    <Pressable onPress={() => router.push(`/return/${rr._id}`)} style={[styles.card, { padding: 20, gap: 16 }]} accessibilityRole="button">
      <View style={styles.activeTop}>
        <LinearGradient colors={[colors.navyDeep, colors.indigoBright]} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activeIcon}>
          <Package size={26} color={colors.white} />
        </LinearGradient>
        <View style={{ flex: 1, gap: 3 }}>
          <Text size={16} weight="bold" numberOfLines={1}>{returnTitle(rr)}</Text>
          <Text size={13} color={colors.muted} numberOfLines={1}>Locker ID {rr.lockerUserId} · {returnOrderRef(rr)}</Text>
        </View>
        <Pill label={returnStatusLabel[rr.status]} background={colors.warningBg} color={colors.ink} />
      </View>
      <View style={styles.progress}><View style={[styles.progressFill, { width: '66%' }]} /></View>
      <View style={styles.activeBottom}>
        <Text size={13} color={colors.muted} style={{ flex: 1 }} numberOfLines={1}>Step 2 of 3 · Code valid until {dateTime(rr.expiresAt)}</Text>
        <View style={styles.link}>
          <Text size={14} weight="bold" color={colors.indigo}>View code</Text>
          <ArrowRight size={14} color={colors.indigo} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  roundBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  hero: {
    height: 196, borderRadius: 32, overflow: 'hidden',
    shadowColor: colors.navy, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  glow: { position: 'absolute', borderRadius: 9999, backgroundColor: colors.white, opacity: 0.14 },
  heroText: { position: 'absolute', left: 26, top: 32, width: 210, gap: 18, alignItems: 'flex-start' },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, backgroundColor: colors.white, borderRadius: 9999, paddingLeft: 18, paddingRight: 16 },
  heroArt: { position: 'absolute', right: 30, top: 44, width: 92, height: 92, borderRadius: 28, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-9deg' }] },
  card: {
    backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.navy, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 1,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepNum: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  nearest: { marginTop: 28, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  pinCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  activeTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  activeIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progress: { height: 8, borderRadius: 4, backgroundColor: colors.lavender, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.navy },
  activeBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
});
