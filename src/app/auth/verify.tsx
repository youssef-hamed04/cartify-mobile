import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, MailCheck } from 'lucide-react-native';
import { authApi, errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { BackButton, Screen, StickyFooter } from '@/components/Screen';
import { Text } from '@/components/Text';
import { splitName } from '@/features/auth/schemas';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { colors, fonts } from '@/theme';

const LENGTH = 6;
const RESEND_SECONDS = 60;

// 08 · Verify Email — 6 code boxes driven by one hidden input (supports paste and OS one-time-code autofill)
export default function Verify() {
  const params = useLocalSearchParams<{ email: string; name?: string; depth?: string; redirect?: string }>();
  const email = String(params.email ?? '');
  const { signIn, updateProfile } = useAuth();
  const toast = useToast();
  const input = useRef<TextInputInstance>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (value = code) => {
    if (value.length !== LENGTH || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { isNew, user } = await signIn(email, value);
      if (params.name) {
        await updateProfile(splitName(params.name)).catch(() => {});
      }
      toast.show(isNew ? 'Welcome to Cartify!' : `Welcome back${user.firstName ? `, ${user.firstName}` : ''}!`);
      // Pop the auth screens so the user lands where they started (e.g. checkout or profile)
      const depth = Number(params.depth ?? 2);
      if (router.canDismiss()) router.dismiss(depth);
      else router.replace('/(tabs)');
      if (params.redirect) router.push(params.redirect as never);
    } catch (e) {
      setError(errorMessage(e));
      setCode('');
      input.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === LENGTH) verify(digits);
  };

  const resend = async () => {
    try {
      await authApi.requestCode(email);
      setSeconds(RESEND_SECONDS);
      toast.show('A new code is on its way');
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    }
  };

  return (
    <Screen
      background={colors.bg}
      footer={
        <StickyFooter>
          <Button title="Verify" onPress={() => verify()} loading={submitting} disabled={code.length !== LENGTH} icon={<Check size={20} color={colors.white} />} />
        </StickyFooter>
      }
    >
      <View style={styles.top}><BackButton /></View>
      <View style={styles.iconWrap}><MailCheck size={36} color={colors.navy} /></View>
      <Text size={30} weight="bold" tracking={-0.6} style={{ marginTop: 14 }} accessibilityRole="header">Check your inbox</Text>
      <Text size={16} color={colors.body} lineHeight={21} style={{ marginTop: 8 }}>
        We sent a 6-digit code to <Text size={16} weight="bold">{email}</Text>
      </Text>

      <Pressable onPress={() => input.current?.focus()} style={styles.boxes} accessibilityLabel="Verification code">
        {Array.from({ length: LENGTH }).map((_, i) => {
          const active = i === code.length && !submitting;
          return (
            <View key={i} style={[styles.box, active && styles.boxActive, !!code[i] && styles.boxFilled, !!error && styles.boxError]}>
              <Text size={28} weight="bold" color={colors.navy}>{code[i] ?? ''}</Text>
            </View>
          );
        })}
        <TextInput
          ref={input}
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={LENGTH}
          autoFocus
          caretHidden
          style={styles.hiddenInput}
          accessibilityLabel="Enter the 6-digit code"
        />
      </Pressable>
      {error ? <Text size={13} color={colors.danger} style={{ marginTop: 10 }}>{error}</Text> : null}

      <View style={styles.resend}>
        <Text size={14} color={colors.body}>Didn’t get it?</Text>
        {seconds > 0 ? (
          <Text size={14} weight="bold" color={colors.muted}>Resend code in 0:{String(seconds).padStart(2, '0')}</Text>
        ) : (
          <Pressable onPress={resend} hitSlop={8} accessibilityRole="button">
            <Text size={14} weight="bold" color={colors.indigo}>Resend code</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: 12, paddingBottom: 28, alignItems: 'flex-start' },
  iconWrap: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  box: { width: 48, height: 64, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: colors.indigo },
  boxFilled: { borderColor: colors.navy, backgroundColor: colors.lavender },
  boxError: { borderColor: colors.danger },
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%', fontFamily: fonts.regular },
  resend: { flexDirection: 'row', gap: 6, marginTop: 18 },
});
