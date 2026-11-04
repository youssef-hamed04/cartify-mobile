import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, ChevronUp, CreditCard, Mail, Search, Truck, Undo2, UserRound, type LucideIcon } from 'lucide-react-native';
import { Screen, ScreenHeader } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { colors } from '@/theme';

const SUPPORT_EMAIL = 'hello@cartify.com'; // from the web support page

// Answers describe how the current backend actually works
const FAQ = [
  { q: 'How do I return an item?', a: 'Open the order (or the Returns tab), tap "Return an item", pick the items and a reason, then get your code. Type the Locker ID and unlock code on any Cartify SmartBox keypad and drop the item inside.' },
  { q: 'How long is my return code valid?', a: 'Return requests are valid for 48 hours. The unlock code rotates every day, so always open the app at the box to see the current code.' },
  { q: 'When will my refund arrive?', a: 'Refunds are processed once the item is returned through a SmartBox and verified by our team.' },
  { q: 'How much is shipping?', a: 'Shipping depends on your governorate (for example Cairo 50, Giza 60, Alexandria 70). You see the exact amount at checkout before placing the order.' },
  { q: 'Which payment methods are supported?', a: 'Cash on delivery is available in the app. Online payment methods are coming soon.' },
  { q: 'How do I sign in?', a: 'Enter your email and we send a 6-digit code. No password is needed. Your guest cart, wishlist and orders move to your account when you sign in.' },
  { q: 'What data do you collect?', a: 'We collect your name, email, phone number and address to process and deliver orders, provide support, and run the Smart Return Box system.' },
  { q: 'Terms of use', a: 'By using Cartify you agree to our terms. Misuse of the automated return system or the platform leads to account suspension.' },
];

// 24 · Help Center
export default function Help() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.map((f, i) => ({ ...f, i })).filter((f) => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  const topics: { label: string; Icon: LucideIcon; onPress: () => void }[] = [
    { label: 'Track order', Icon: Truck, onPress: () => router.push('/orders') },
    { label: 'Returns', Icon: Undo2, onPress: () => router.push('/returns') },
    { label: 'Payments', Icon: CreditCard, onPress: () => setQuery('payment') },
    { label: 'Account', Icon: UserRound, onPress: () => router.push('/profile') },
  ];

  return (
    <Screen header={<ScreenHeader title="Help Center" />} contentStyle={{ gap: 24 }}>
      <TextField
        icon={<Search size={20} color={colors.muted} />}
        placeholder="How can we help?"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      {!query ? (
        <View style={styles.topics}>
          {topics.map(({ label, Icon, onPress }) => (
            <Pressable key={label} onPress={onPress} style={({ pressed }) => [styles.topic, pressed && { opacity: 0.85 }]} accessibilityRole="button">
              <View style={styles.topicIcon}><Icon size={24} color={colors.navy} /></View>
              <Text size={16} weight="bold">{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <Text size={18} weight="bold">{query ? `Results (${results.length})` : 'Popular questions'}</Text>
        {results.length === 0 ? <Text color={colors.muted}>No answers match “{query}”. Try another word or email us.</Text> : null}
        {results.map((f) => {
          const expanded = open === f.i || !!query;
          return (
            <Pressable
              key={f.q}
              onPress={() => setOpen(expanded && !query ? null : f.i)}
              style={styles.faq}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
            >
              <View style={styles.faqHead}>
                <Text size={15} weight="semibold" style={{ flex: 1 }}>{f.q}</Text>
                {expanded ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
              </View>
              {expanded ? <Text size={14} color={colors.body} lineHeight={20}>{f.a}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Cartify app support')}`)}
        style={styles.chat}
        accessibilityRole="button"
      >
        <View style={styles.chatIcon}><Mail size={20} color={colors.white} /></View>
        <View style={{ flex: 1 }}>
          <Text size={15} weight="bold" color={colors.white}>Email support</Text>
          <Text size={12} color="rgba(255,255,255,0.8)">{SUPPORT_EMAIL}</Text>
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  topic: { width: '48%', flexGrow: 1, height: 115, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 20, justifyContent: 'space-between' },
  topicIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  faq: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 20, paddingVertical: 18, gap: 10 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chat: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.navy, borderRadius: 24, padding: 16, minHeight: 72 },
  chatIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
});
