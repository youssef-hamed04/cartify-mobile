import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { FloatingBadge, LogoMark } from '@/components/Brand';
import { Text } from '@/components/Text';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

// 01 · Splash — shown while the stored session is restored, then routes to onboarding or the app
export default function Splash() {
  const { status, onboarded } = useAuth();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  if (status !== 'loading' && minTimeDone) {
    return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
  }

  return (
    <LinearGradient colors={[colors.navyDeep, colors.navy, colors.indigoBright]} locations={[0, 0.357, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={styles.fill}>
      <StatusBar style="light" />
      <View style={[styles.glow, { width: 360, height: 360, right: -160, top: -120, backgroundColor: colors.indigo }]} />
      <View style={[styles.glow, { width: 340, height: 340, left: -150, bottom: -60, backgroundColor: colors.periwinkle }]} />
      <View style={[styles.glow, { width: 70, height: 70, right: 40, bottom: 134, backgroundColor: 'rgba(255,255,255,0.12)' }]} />
      <FloatingBadge label="INSTANT!" rotate={-8} style={{ right: 48, top: '22%' }} />
      <FloatingBadge label="BEST CHOICE" variant="periwinkle" rotate={7} style={{ left: 36, bottom: '31%' }} />
      <View style={styles.brand}>
        <View style={styles.logoShadow}><LogoMark size={104} /></View>
        <Text size={48} weight="bold" color={colors.white} tracking={-1.44}>Cartify</Text>
        <Text size={17} color="rgba(255,255,255,0.8)">Shop Smarter. Return Easier.</Text>
      </View>
      <View style={styles.loader} accessibilityLabel="Loading">
        <View style={styles.dot} />
        <View style={[styles.dot, { width: 34, backgroundColor: colors.white }]} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', borderRadius: 9999 },
  brand: { alignItems: 'center', gap: 18 },
  logoShadow: { shadowColor: colors.navy, shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 16 }, elevation: 10, borderRadius: 32 },
  loader: { position: 'absolute', bottom: 94, flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.35)' },
});
