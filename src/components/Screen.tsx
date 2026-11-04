import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing } from '@/theme';
import { IconButton } from './Button';
import { Text } from './Text';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
  header?: ReactNode; // fixed above the scroll area
  footer?: ReactNode; // sticky bottom area (e.g. primary CTA)
  scrollProps?: ScrollViewProps;
}

export function Screen({ children, scroll = true, edges = ['top'], background = colors.bg, contentStyle, header, footer, scrollProps }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...scrollProps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

export function BackButton({ onPress, tint = 'light' }: { onPress?: () => void; tint?: 'light' | 'glass' }) {
  return (
    <IconButton
      label="Go back"
      onPress={onPress ?? goBack}
      background={tint === 'glass' ? 'rgba(255,255,255,0.18)' : colors.white}
      bordered={tint === 'light'}
    >
      <ChevronLeft size={22} color={tint === 'glass' ? colors.white : colors.ink} />
    </IconButton>
  );
}

export function ScreenHeader({ title, subtitle, right, back = true }: { title: string; subtitle?: string; right?: ReactNode; back?: boolean }) {
  return (
    <View style={styles.header}>
      {back ? <BackButton /> : <View style={styles.placeholder} />}
      <View style={styles.headerTitle}>
        <Text size={18} weight="bold" numberOfLines={1} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text size={12} color={colors.muted} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ?? <View style={styles.placeholder} />}
    </View>
  );
}

// White rounded sheet pinned under primary CTAs in the design
export function StickyFooter({ children }: { children: ReactNode }) {
  return <SafeAreaView edges={['bottom']} style={styles.footer}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.screen, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 16, gap: 12 },
  headerTitle: { flex: 1, alignItems: 'center' },
  placeholder: { width: 44 },
  footer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.screen,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
});
