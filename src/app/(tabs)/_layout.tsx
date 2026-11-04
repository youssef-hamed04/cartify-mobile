import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, LayoutGrid, ShoppingCart, Undo2, User, type LucideIcon } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { useCartCount } from '@/hooks/queries';
import { colors } from '@/theme';

const TABS: Record<string, { label: string; Icon: LucideIcon }> = {
  index: { label: 'Home', Icon: House },
  categories: { label: 'Shop', Icon: LayoutGrid },
  returns: { label: 'Returns', Icon: Undo2 },
  cart: { label: 'Cart', Icon: ShoppingCart },
  profile: { label: 'Me', Icon: User },
};

// Floating navy pill from the design: active tab expands to an indigo pill with its label
function PillTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const cartCount = useCartCount();
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={route.name === 'cart' && cartCount ? `Cart, ${cartCount} items` : tab.label}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <tab.Icon size={22} color={focused ? colors.white : colors.periwinkle} strokeWidth={2} />
              {focused ? <Text size={14} weight="bold" color={colors.white}>{tab.label}</Text> : null}
              {route.name === 'cart' && cartCount > 0 ? (
                <View style={[styles.badge, focused && { left: 26 }]}>
                  <Text size={10} weight="bold" color={colors.white}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="categories" />
      <Tabs.Screen name="returns" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 24, right: 24 },
  bar: {
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: colors.navy,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  tab: { height: 44, minWidth: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  tabActive: { backgroundColor: colors.indigo, paddingLeft: 14, paddingRight: 16 },
  badge: {
    position: 'absolute',
    left: 24,
    top: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
