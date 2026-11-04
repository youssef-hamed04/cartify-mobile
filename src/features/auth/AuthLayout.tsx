import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LightStatusBar } from '@/components/LightStatusBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FloatingBadge, LogoMark } from '@/components/Brand';
import { GradientHero } from '@/components/GradientHero';
import { BackButton } from '@/components/Screen';
import { Text } from '@/components/Text';
import { colors, shadows } from '@/theme';

interface AuthLayoutProps {
  headline: string;
  subtitle?: string;
  badges: { label: string; variant?: 'white' | 'periwinkle' }[];
  children: ReactNode;
}

// 05 Login / 06 Sign up: gradient hero with logo + headline, white sheet (36 radius) overlapping it
export function AuthLayout({ headline, subtitle, badges, children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LightStatusBar />
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <GradientHero style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          {router.canGoBack() ? <View style={[styles.back, { top: insets.top + 12 }]}><BackButton tint="glass" /></View> : null}
          <View style={styles.logoRow}>
            <LogoMark />
            <Text size={26} weight="bold" color={colors.white} tracking={-0.52}>Cartify</Text>
          </View>
          <Text size={46} weight="bold" color={colors.white} lineHeight={48} tracking={-1.38} style={styles.headline}>{headline}</Text>
          {subtitle ? <Text size={16} color={colors.white} lineHeight={22} style={{ width: 230, marginTop: 14 }}>{subtitle}</Text> : null}
          {badges[0] ? <FloatingBadge label={badges[0].label} variant={badges[0].variant} rotate={-8} style={{ right: 40, top: insets.top + 100 }} /> : null}
          {badges[1] ? <FloatingBadge label={badges[1].label} variant={badges[1].variant ?? 'periwinkle'} rotate={7} style={{ right: 34, top: insets.top + 178 }} /> : null}
        </GradientHero>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.white },
  hero: { minHeight: 400, paddingHorizontal: 28, paddingBottom: 80 },
  back: { position: 'absolute', right: 24, top: 0, zIndex: 2 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  headline: { marginTop: 44, width: 240 },
  sheet: {
    flex: 1,
    marginTop: -52,
    backgroundColor: colors.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 32,
    gap: 16,
    ...shadows.sheet,
  },
});
