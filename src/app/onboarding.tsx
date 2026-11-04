import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, QrCode, ShoppingBag, Box, ShieldCheck } from 'lucide-react-native';
import { FloatingBadge } from '@/components/Brand';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useAuth } from '@/providers/AuthProvider';
import { colors, heroGradient } from '@/theme';

// 02–04 · Onboarding. Slide 1 copy is from Figma; slides 2–3 copy is written for the SmartBox/confidence art
const SLIDES = [
  { title: 'Smarter Shopping\nStarts Here', text: 'Lightning-fast shopping and a modern retail journey made just for you.', Art: ShoppingBag, badge: 'INSTANT!' as const },
  { title: 'Return Anything,\nAnytime', text: 'Get a code in the app and drop your item at any SmartBox. No labels, no queues.', Art: Box, badge: 'SMARTBOX' as const },
  { title: 'Shop With\nConfidence', text: 'Track every order and return in one place, from checkout to doorstep.', Art: ShieldCheck, badge: 'BEST CHOICE' as const },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList>(null);

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };
  const next = () => (index < SLIDES.length - 1 ? list.current?.scrollToIndex({ index: index + 1 }) : finish());
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  const last = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        {!last ? (
          <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
            <Text size={15} weight="bold" color={colors.muted}>Skip</Text>
          </Pressable>
        ) : <View style={{ height: 19 }} />}
      </View>
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(s) => s.badge}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <View style={{ width }}>
            <View style={styles.illustrationWrap}>
              <LinearGradient {...heroGradient} style={styles.illustration}>
                <View style={[styles.glow, { width: 260, height: 260, left: 170, top: -90, backgroundColor: colors.indigo }]} />
                <View style={[styles.glow, { width: 220, height: 220, left: -80, top: 250, backgroundColor: colors.periwinkle }]} />
                <View style={[styles.glow, { width: 56, height: 56, right: 14, top: 330, backgroundColor: 'rgba(255,255,255,0.15)' }]} />
                <LinearGradient colors={[colors.periwinkle, colors.indigo]} locations={[0, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.art}>
                  <item.Art size={96} color={colors.white} strokeWidth={1.4} />
                </LinearGradient>
                {i === 0 ? (
                  <View style={styles.discount}><Text size={34} weight="bold" color={colors.white}>%</Text></View>
                ) : i === 1 ? (
                  <View style={[styles.discount, styles.qr]}><QrCode size={56} color={colors.navy} /></View>
                ) : (
                  <View style={[styles.discount, { backgroundColor: colors.success }]}><Check size={36} color={colors.white} strokeWidth={3} /></View>
                )}
                <FloatingBadge label={item.badge} variant={i === 2 ? 'periwinkle' : 'white'} rotate={5} style={{ left: 28, top: 316 }} />
              </LinearGradient>
            </View>
            <View style={styles.text}>
              <Text size={30} weight="bold" lineHeight={34} tracking={-0.6}>{item.title}</Text>
              <Text size={16} color={colors.body} lineHeight={22}>{item.text}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => <View key={s.badge} style={[styles.dot, i === index && styles.dotActive]} />)}
        </View>
        <Button
          title={last ? 'Get Started' : 'Next'}
          onPress={next}
          icon={<ArrowRight size={20} color={colors.white} />}
          style={{ alignSelf: 'auto', paddingLeft: 28, paddingRight: 26 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 4 },
  illustrationWrap: { paddingHorizontal: 20, paddingTop: 12 },
  illustration: {
    height: 396, borderRadius: 40, overflow: 'hidden',
    shadowColor: colors.navy, shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 10,
  },
  glow: { position: 'absolute', borderRadius: 9999 },
  art: { position: 'absolute', left: 62, top: 95, width: 190, height: 190, borderRadius: 44, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }] },
  discount: { position: 'absolute', left: 232, top: 250, width: 72, height: 72, borderRadius: 36, backgroundColor: colors.coral, borderWidth: 4, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  qr: { width: 100, height: 100, borderRadius: 24, top: 244, backgroundColor: colors.white, borderWidth: 0 },
  text: { paddingHorizontal: 28, paddingTop: 26, gap: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 28, backgroundColor: colors.navy },
});
