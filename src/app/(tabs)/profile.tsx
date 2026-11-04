import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Heart, LifeBuoy, LogIn, LogOut, MapPin, Package, Settings, Undo2, type LucideIcon } from 'lucide-react-native';
import { IconButton } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useOrders, useReturns, useWishlist } from '@/hooks/queries';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';

// 23 · Profile. "Wallet" and "Payment Methods" have no backend, so they are replaced by Returns and Wishlist.
export default function Profile() {
  const { user, status, signOut } = useAuth();
  const orders = useOrders();
  const returns = useReturns();
  const wishlist = useWishlist();
  const signedIn = status === 'authenticated';

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initial = (user?.firstName || user?.email || 'G').charAt(0).toUpperCase();

  const confirmLogout = () =>
    Alert.alert('Log out?', 'Your cart and wishlist stay saved in your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);

  const menu: { label: string; Icon: LucideIcon; onPress: () => void }[] = [
    { label: 'My Orders', Icon: Package, onPress: () => router.push('/orders') },
    { label: 'Smart Returns', Icon: Undo2, onPress: () => router.push('/returns') },
    { label: 'Wishlist', Icon: Heart, onPress: () => router.push('/wishlist') },
    ...(signedIn ? [{ label: 'Addresses', Icon: MapPin, onPress: () => router.push('/edit-profile') }] : []),
    { label: 'Help Center', Icon: LifeBuoy, onPress: () => router.push('/help') },
  ];

  return (
    <Screen contentStyle={{ paddingBottom: spacing.tabBar }}>
      <View style={styles.header}>
        <View style={{ width: 46 }} />
        <Text size={22} weight="bold" accessibilityRole="header">Profile</Text>
        {signedIn ? (
          <IconButton label="Settings" size={46} bordered onPress={() => router.push('/edit-profile')}>
            <Settings size={20} color={colors.ink} />
          </IconButton>
        ) : <View style={{ width: 46 }} />}
      </View>

      <LinearGradient colors={[colors.navyDeep, colors.navy, colors.indigoBright]} locations={[0, 0.357, 0.714]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={[styles.glow, { width: 160, height: 160, right: -40, top: -60 }]} />
        <View style={styles.avatar}><Text size={30} weight="bold" color={colors.navy}>{initial}</Text></View>
        <View style={{ flex: 1, gap: 4 }}>
          {signedIn ? (
            <>
              <Text size={22} weight="bold" color={colors.white} numberOfLines={1}>{name || 'Cartify shopper'}</Text>
              <Text size={13} color="rgba(255,255,255,0.8)" numberOfLines={1}>{user?.email}</Text>
              <Pressable onPress={() => router.push('/edit-profile')} style={styles.editPill} accessibilityRole="button">
                <Text size={12} weight="bold" color={colors.white}>Edit profile</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text size={20} weight="bold" color={colors.white}>Shopping as guest</Text>
              <Text size={13} color="rgba(255,255,255,0.8)">Sign in to sync orders and returns across devices.</Text>
              <Pressable onPress={() => router.push('/auth/login')} style={styles.editPill} accessibilityRole="button">
                <Text size={12} weight="bold" color={colors.white}>Sign in</Text>
              </Pressable>
            </>
          )}
        </View>
      </LinearGradient>

      <View style={styles.stats}>
        <Stat value={orders.data?.length} label="Orders" onPress={() => router.push('/orders')} />
        <Stat value={returns.data?.length} label="Returns" onPress={() => router.push('/returns')} />
        <Stat value={wishlist.data?.length} label="Wishlist" onPress={() => router.push('/wishlist')} />
      </View>

      <View style={styles.menu}>
        {menu.map(({ label, Icon, onPress }) => (
          <MenuRow key={label} label={label} Icon={Icon} onPress={onPress} />
        ))}
        {signedIn ? (
          <MenuRow label="Log out" Icon={LogOut} onPress={confirmLogout} danger />
        ) : (
          <MenuRow label="Sign in" Icon={LogIn} onPress={() => router.push('/auth/login')} />
        )}
      </View>
    </Screen>
  );
}

function Stat({ value, label, onPress }: { value?: number; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stat} accessibilityRole="button" accessibilityLabel={`${value ?? 0} ${label}`}>
      <Text size={26} weight="bold" color={colors.navy}>{value ?? '–'}</Text>
      <Text size={13} color={colors.muted}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({ label, Icon, onPress, danger }: { label: string; Icon: LucideIcon; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bg }]} accessibilityRole="button">
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.dangerBg }]}>
        <Icon size={20} color={danger ? colors.danger : colors.navy} />
      </View>
      <Text size={16} weight="semibold" color={danger ? colors.danger : colors.ink} style={{ flex: 1 }}>{label}</Text>
      {!danger ? <ChevronRight size={20} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  card: { marginTop: 24, borderRadius: 30, padding: 20, minHeight: 128, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden' },
  glow: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.12)' },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  editPill: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5 },
  stats: { flexDirection: 'row', gap: 16, marginTop: 24 },
  stat: { flex: 1, height: 117, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 15, justifyContent: 'flex-end', gap: 6 },
  menu: { marginTop: 24, backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, paddingVertical: 6, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 8, minHeight: 54 },
  rowIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
});
