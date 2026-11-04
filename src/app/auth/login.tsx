import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Mail } from 'lucide-react-native';
import { authApi, errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { loginSchema, type LoginValues } from '@/features/auth/schemas';
import { colors } from '@/theme';

// 05 · Login — adapted to passwordless email-code sign-in (the backend has no passwords for customers)
export default function Login() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await authApi.requestCode(email);
      router.push({ pathname: '/auth/verify', params: { email, depth: '2', ...(redirect ? { redirect } : {}) } });
    } catch (e) {
      setError('email', { message: errorMessage(e) });
    }
  });

  return (
    <AuthLayout headline={'Welcome\nback.'} subtitle="Sign in to keep shopping smarter." badges={[{ label: 'INSTANT!' }, { label: 'BEST CHOICE' }]}>
      <Text size={24} weight="bold" tracking={-0.24} accessibilityRole="header">Sign in</Text>
      <Text size={14} color={colors.body} lineHeight={20}>Enter your email and we’ll send you a 6-digit sign-in code. No password needed.</Text>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            icon={<Mail size={20} color={colors.muted} />}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => onSubmit()}
            error={errors.email?.message}
          />
        )}
      />
      <Button title="Send code" onPress={() => onSubmit()} loading={isSubmitting} icon={<ArrowRight size={20} color={colors.white} />} />
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.guest} accessibilityRole="button">
        <Text size={14} weight="medium" color={colors.indigo}>Continue as guest</Text>
      </Pressable>
      <View style={styles.footer}>
        <Text size={14} color={colors.body}>Don’t have an account?</Text>
        <Pressable onPress={() => router.push({ pathname: '/auth/signup', params: redirect ? { redirect, from: 'login' } : { from: 'login' } })} hitSlop={8} accessibilityRole="link">
          <Text size={14} weight="bold" color={colors.indigo}>Sign up</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  guest: { alignSelf: 'center', paddingVertical: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 },
});
