import { useCallback, useRef } from 'react';
import { Pressable, Share, StyleSheet, View, type HostInstance } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { ArrowRight, Check, Clock, Copy, Download, MapPin, Share2, XCircle } from 'lucide-react-native';
import type { ReturnRequest } from '@/api';
import { Button } from '@/components/Button';
import { GradientHero } from '@/components/GradientHero';
import { Card } from '@/components/Misc';
import { BackButton, Screen, ScreenHeader, StickyFooter } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { BoxCheck } from '@/features/returns/BoxCheck';
import { isActiveReturn, returnOrderRef, returnTitle } from '@/features/returns/utils';
import { useReturn } from '@/hooks/queries';
import { dateTime, returnReasonLabel, returnStatusLabel } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { colors, shadows, spacing } from '@/theme';

export default function ReturnDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading, error, refetch } = useReturn(id ?? '');

  // The unlock code rotates daily, so always re-read it when the screen is shown
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  if (isLoading) return <Screen header={<ScreenHeader title="Your return" />}><LoadingView /></Screen>;
  if (error || !data) return <Screen header={<ScreenHeader title="Your return" />}><ErrorView error={error} onRetry={refetch} /></Screen>;
  if (isActiveReturn(data) && data.unlockCode != null) return <CodeView rr={data} />;
  if (data.status === 'completed') return <ReceivedView rr={data} />;
  return <ClosedView rr={data} />;
}

// Figma 30 · Return 4 · Your Code (built from layer metadata + screenshot)
function CodeView({ rr }: { rr: ReturnRequest }) {
  const toast = useToast();
  const cardRef = useRef<HostInstance>(null);
  const code = String(rr.unlockCode);
  const qrValue = JSON.stringify({ lockerUserId: rr.lockerUserId, unlockCode: code });

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    toast.show(`${label} copied`);
  };

  const save = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) return toast.show('Saving is not available on this device', 'error');
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Save your return code', UTI: 'public.png' });
    } catch {
      toast.show("Couldn't save the code. Try a screenshot instead.", 'error');
    }
  };

  const share = () =>
    Share.share({
      message: `My Cartify SmartBox return\nLocker ID: ${rr.lockerUserId}\nUnlock code: ${code}\nValid until ${dateTime(rr.expiresAt)}`,
    }).catch(() => {});

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <Screen
        edges={[]}
        contentStyle={{ paddingHorizontal: 0 }}
        footer={
          <StickyFooter>
            <Button title="Find a SmartBox" icon={<MapPin size={20} color={colors.white} />} onPress={() => router.push('/lockers')} />
          </StickyFooter>
        }
      >
        <GradientHero style={styles.hero}>
          <SafeAreaView edges={['top']} style={styles.heroInner}>
            <BackButton tint="glass" />
            <View style={{ gap: 6, marginTop: 22 }}>
              <Text size={13} weight="medium" color="rgba(255,255,255,0.8)">{returnOrderRef(rr)} · {returnTitle(rr)}</Text>
              <Text size={34} weight="bold" color={colors.white} tracking={-0.68} accessibilityRole="header">Your return code</Text>
              <Text size={15} color="rgba(255,255,255,0.75)">Enter these at any SmartBox keypad</Text>
            </View>
          </SafeAreaView>
        </GradientHero>

        <View ref={cardRef} collapsable={false} style={styles.codeCard}>
          <View style={styles.qrWrap} accessible accessibilityLabel="Return QR code">
            <QRCode value={qrValue} size={150} color={colors.ink} backgroundColor={colors.lavender} />
          </View>

          <View style={styles.codes}>
            <CodeBox label="Locker ID" value={rr.lockerUserId} onCopy={() => copy('Locker ID', rr.lockerUserId)} />
            <CodeBox label="Unlock code" value={code} onCopy={() => copy('Unlock code', code)} />
          </View>
          <Text size={13} color={colors.muted} align="center">Type the Locker ID, then the unlock code on the SmartBox screen</Text>

          <View style={styles.validity}>
            <Clock size={16} color={colors.warning} />
            <Text size={13} weight="bold" color={colors.ink}>Valid until {dateTime(rr.expiresAt)}</Text>
          </View>

          <View style={styles.actions}>
            <Button title="Save" variant="outline" height={48} leftIcon={<Download size={18} color={colors.navy} />} onPress={save} style={{ flex: 1 }} />
            <Button title="Share" variant="outline" height={48} leftIcon={<Share2 size={18} color={colors.navy} />} onPress={share} style={{ flex: 1 }} />
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.screen }}><BoxCheck rr={rr} /></View>

        <Text size={12} color={colors.muted} align="center" style={styles.footnote}>
          The unlock code changes every day. Open this screen at the box to see today&apos;s code.
        </Text>
      </Screen>
    </View>
  );
}

function CodeBox({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <Pressable onPress={onCopy} style={styles.codeBox} accessibilityRole="button" accessibilityLabel={`${label} ${value.split('').join(' ')}, tap to copy`}>
      <Text size={12} weight="semibold" color={colors.muted}>{label}</Text>
      <Text size={32} weight="bold" color={colors.navy} tracking={3} selectable>{value}</Text>
      <View style={styles.copyHint}>
        <Copy size={12} color={colors.indigo} />
        <Text size={11} weight="semibold" color={colors.indigo}>Copy</Text>
      </View>
    </Pressable>
  );
}

// Adapted Figma 33 · Return 7 (built from layer metadata): the backend records the drop-off, not a refund
function ReceivedView({ rr }: { rr: ReturnRequest }) {
  const steps = [
    { label: 'Return requested', at: rr.createdAt, done: true },
    { label: 'Code generated', at: rr.createdAt, done: true },
    { label: rr.processedByBox ? `Dropped at SmartBox ${rr.processedByBox}` : 'Dropped at SmartBox', at: rr.completedAt ?? null, done: true },
    { label: 'Refund review', at: null, done: false },
  ];
  return (
    <Screen
      footer={
        <StickyFooter>
          <Button title="Back to orders" icon={<ArrowRight size={20} color={colors.white} />} onPress={() => router.replace('/orders')} />
        </StickyFooter>
      }
    >
      <View style={styles.success}>
        <View style={[styles.ring, { width: 168, height: 168, opacity: 0.5 }]} />
        <View style={[styles.ring, { width: 128, height: 128 }]} />
        <View style={styles.check}><Check size={46} color={colors.white} strokeWidth={3} /></View>
        {[
          { left: 40, top: 20, size: 12, color: colors.coral },
          { right: 42, top: 30, size: 10, color: colors.indigo },
          { left: 60, top: 120, size: 14, color: colors.periwinkle },
          { right: 46, top: 118, size: 16, color: colors.star },
        ].map(({ size, color, ...pos }, i) => (
          <View key={i} style={[styles.confetti, pos, { width: size, height: size, backgroundColor: color }]} />
        ))}
      </View>
      <View style={{ gap: 8, marginTop: 22 }}>
        <Text size={30} weight="bold" align="center" tracking={-0.6} accessibilityRole="header">Return received</Text>
        <Text size={15} color={colors.body} align="center" lineHeight={21}>
          We received your {returnTitle(rr)} at the SmartBox. Our team will review it and process your refund.
        </Text>
      </View>

      <Card style={styles.summary}>
        <Text size={13} weight="semibold" color={colors.muted}>{returnOrderRef(rr)}</Text>
        {rr.items.map((item) => (
          <Text key={`${item.productId}:${item.color}`} size={15} weight="bold">
            {item.quantity} × {item.name} <Text size={13} color={colors.muted}>({item.color})</Text>
          </Text>
        ))}
        <Text size={13} color={colors.body}>Reason: {returnReasonLabel[rr.reason]}</Text>
      </Card>

      <BoxCheck rr={rr} />

      <Card style={styles.timeline}>
        {steps.map((s) => (
          <View key={s.label} style={styles.stepRow}>
            <View style={[styles.stepDot, !s.done && styles.stepDotPending]}>
              {s.done ? <Check size={12} color={colors.white} strokeWidth={3} /> : null}
            </View>
            <Text size={15} weight={s.done ? 'bold' : 'medium'} color={s.done ? colors.ink : colors.muted} style={{ flex: 1 }}>{s.label}</Text>
            {s.at ? <Text size={13} color={colors.muted}>{dateTime(s.at)}</Text> : <Text size={13} color={colors.muted}>Pending</Text>}
          </View>
        ))}
      </Card>
    </Screen>
  );
}

// Expired or denied returns: no code to show
function ClosedView({ rr }: { rr: ReturnRequest }) {
  const expired = rr.status === 'expired' || (rr.status === 'pending' && new Date(rr.expiresAt) <= new Date());
  return (
    <Screen header={<ScreenHeader title="Your return" />}>
      <View style={styles.closed}>
        <View style={styles.closedIcon}>{expired ? <Clock size={30} color={colors.warning} /> : <XCircle size={30} color={colors.danger} />}</View>
        <Text size={22} weight="bold" align="center">{expired ? 'This code has expired' : returnStatusLabel[rr.status]}</Text>
        <Text color={colors.body} align="center" lineHeight={20}>
          {expired
            ? `Return codes are valid for 48 hours. This one expired on ${dateTime(rr.expiresAt)}. Start a new return to get a fresh code.`
            : 'This return request was denied. Contact support if you think this is a mistake.'}
        </Text>
      </View>
      <Card style={{ gap: 6 }}>
        <Text size={13} weight="semibold" color={colors.muted}>{returnOrderRef(rr)}</Text>
        <Text size={15} weight="bold">{returnTitle(rr)}</Text>
        <Text size={13} color={colors.body}>Reason: {returnReasonLabel[rr.reason]}</Text>
      </Card>
      <View style={{ gap: 12, marginTop: 24 }}>
        {expired ? (
          <Button
            title="Start a new return"
            onPress={() => router.replace({ pathname: '/return/select', params: rr.orderId && typeof rr.orderId === 'object' ? { orderId: rr.orderId._id } : {} })}
          />
        ) : null}
        <Button title="Contact support" variant="outline" onPress={() => router.push('/help')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 290 },
  heroInner: { paddingHorizontal: spacing.screen, paddingTop: 12 },
  codeCard: {
    marginTop: -54,
    marginHorizontal: spacing.screen,
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 24,
    gap: 16,
    alignItems: 'center',
    ...shadows.card,
    shadowOpacity: 0.12,
  },
  qrWrap: { width: 186, height: 186, borderRadius: 28, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  codes: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  codeBox: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  copyHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  validity: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warningBg, borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8 },
  actions: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  footnote: { marginTop: 16, paddingHorizontal: spacing.screen },
  success: { height: 168, marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 9999, backgroundColor: colors.lavender },
  check: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', ...shadows.button },
  confetti: { position: 'absolute', borderRadius: 9999 },
  summary: { marginTop: 22, gap: 6 },
  timeline: { marginTop: 16, gap: 14, padding: 22 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  stepDotPending: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border },
  closed: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  closedIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
});
