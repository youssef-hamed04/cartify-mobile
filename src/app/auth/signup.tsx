import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Mail, User } from 'lucide-react-native';
import { authApi, errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { signupSchema, type SignupValues } from '@/features/auth/schemas';
import { colors } from '@/theme';

// 06 · Sign up — name + email, verified by the same 6-digit email code (no password on the backend)
export default function Signup() {
  const { redirect, from } = useLocalSearchParams<{ redirect?: string; from?: string }>();
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', terms: false as unknown as true },
  });

  const onSubmit = handleSubmit(async ({ fullName, email }) => {
    try {
      await authApi.requestCode(email);
      router.push({
        pathname: '/auth/verify',
        params: { email, name: fullName, depth: from === 'login' ? '3' : '2', ...(redirect ? { redirect } : {}) },
      });
    } catch (e) {
      setError('email', { message: errorMessage(e) });
    }
  });

  return (
    <AuthLayout headline={'Join\nCartify.'} subtitle="Create your account in seconds." badges={[{ label: 'JOIN 10K+', variant: 'periwinkle' }]}>
      <Text size={24} weight="bold" tracking={-0.24} accessibilityRole="header">Sign up</Text>
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            icon={<User size={20} color={colors.muted} />}
            placeholder="Full name"
            autoComplete="name"
            textContentType="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />
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
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="terms"
        render={({ field }) => (
          <View style={{ gap: 6 }}>
            <Pressable
              onPress={() => field.onChange(!field.value)}
              style={styles.terms}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!field.value }}
            >
              <View style={[styles.checkbox, field.value && styles.checked]}>
                {field.value ? <Check size={16} color={colors.white} strokeWidth={3} /> : null}
              </View>
              <Text size={14} color={colors.body} style={{ flex: 1 }}>
                I agree to the{' '}
                <Text size={14} weight="bold" color={colors.indigo} onPress={() => router.push('/help')}>Terms &amp; Privacy Policy</Text>
              </Text>
            </Pressable>
            {errors.terms ? <Text size={12} color={colors.danger}>{errors.terms.message}</Text> : null}
          </View>
        )}
      />
      <Button title="Create account" onPress={() => onSubmit()} loading={isSubmitting} icon={<ArrowRight size={20} color={colors.white} />} />
      <View style={styles.footer}>
        <Text size={14} color={colors.body}>Already have an account?</Text>
        <Pressable
          onPress={() => (from === 'login' ? router.back() : router.replace({ pathname: '/auth/login', params: redirect ? { redirect } : {} }))}
          hitSlop={8}
          accessibilityRole="link"
        >
          <Text size={14} weight="bold" color={colors.indigo}>Sign in</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  terms: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  checked: { backgroundColor: colors.navy, borderColor: colors.navy },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 },
});
