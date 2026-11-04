import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CloudOff, PackageOpen } from 'lucide-react-native';
import { ApiError, errorMessage } from '@/api';
import { colors } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLabel={label ?? 'Loading'}>
      <ActivityIndicator size="large" color={colors.navy} />
      {label ? <Text color={colors.muted}>{label}</Text> : null}
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = error instanceof ApiError && error.isNetwork;
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}><CloudOff size={30} color={colors.navy} /></View>
      <Text size={18} weight="bold" align="center">{offline ? "You're offline" : 'Something went wrong'}</Text>
      <Text color={colors.muted} align="center">{errorMessage(error)}</Text>
      {onRetry ? <Button title="Try again" variant="outline" height={48} onPress={onRetry} style={styles.btn} /> : null}
    </View>
  );
}

export function EmptyView({ icon, title, message, action }: { icon?: ReactNode; title: string; message?: string; action?: ReactNode }) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>{icon ?? <PackageOpen size={30} color={colors.navy} />}</View>
      <Text size={18} weight="bold" align="center">{title}</Text>
      {message ? <Text color={colors.muted} align="center" lineHeight={20}>{message}</Text> : null}
      {action ? <View style={styles.btn}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10, minHeight: 280 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  btn: { alignSelf: 'stretch', marginTop: 10 },
});
