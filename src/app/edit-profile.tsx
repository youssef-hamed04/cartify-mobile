import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Home, Mail, Phone, User } from 'lucide-react-native';
import { errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Misc';
import { Screen, ScreenHeader, StickyFooter } from '@/components/Screen';
import { EmptyView } from '@/components/States';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { GOVERNORATES } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { colors, spacing } from '@/theme';

// Mirrors backend updateUserRules (names ≥ 2, Egyptian mobile numbers)
const schema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().trim().regex(/^(010|011|012|015)[0-9]{8}$/, 'Enter an Egyptian mobile number, e.g. 01012345678').or(z.literal('')),
  address: z.string().trim(),
  city: z.string().trim(),
  governorate: z.string(),
});
type Values = z.infer<typeof schema>;

export default function EditProfile() {
  const { user, status, updateProfile } = useAuth();
  const toast = useToast();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', phone: '', address: '', city: '', governorate: '' },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '', lastName: user.lastName ?? '', phone: user.phone ?? '',
        address: user.address ?? '', city: user.city ?? '', governorate: user.governorate ?? '',
      });
    }
  }, [user, reset]);

  if (status !== 'authenticated') {
    return (
      <Screen header={<ScreenHeader title="Edit profile" />}>
        <EmptyView title="Sign in to edit your profile" action={<Button title="Sign in" onPress={() => router.push('/auth/login')} />} />
      </Screen>
    );
  }

  const onSubmit = handleSubmit(async (v) => {
    try {
      // The backend rejects an empty governorate, so only send it when chosen
      const { governorate, ...rest } = v;
      await updateProfile({ ...rest, ...(governorate ? { governorate } : {}) });
      toast.show('Profile saved');
      router.back();
    } catch (e) {
      toast.show(errorMessage(e), 'error');
    }
  });

  const field = (name: keyof Values, placeholder: string, Icon: typeof User, extra: object = {}) => (
    <Controller
      control={control}
      name={name}
      render={({ field: f }) => (
        <TextField
          label={placeholder}
          icon={<Icon size={20} color={colors.muted} />}
          placeholder={placeholder}
          value={f.value}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          error={errors[name]?.message}
          {...extra}
        />
      )}
    />
  );

  return (
    <Screen
      header={<ScreenHeader title="Edit profile" />}
      contentStyle={{ gap: 14 }}
      footer={<StickyFooter><Button title="Save changes" onPress={() => onSubmit()} loading={isSubmitting} disabled={!isDirty} /></StickyFooter>}
    >
      <TextField label="Email" icon={<Mail size={20} color={colors.muted} />} value={user?.email} editable={false} style={{ color: colors.muted }} />
      {field('firstName', 'First name', User, { autoComplete: 'given-name' })}
      {field('lastName', 'Last name', User, { autoComplete: 'family-name' })}
      {field('phone', 'Phone', Phone, { keyboardType: 'phone-pad', autoComplete: 'tel', maxLength: 11 })}
      <Text size={18} weight="bold" style={{ marginTop: 10 }}>Delivery address</Text>
      {field('address', 'Street address', Home, { autoComplete: 'street-address' })}
      {field('city', 'City', Building2)}
      <Text size={13} weight="semibold" color={colors.body}>Governorate</Text>
      <Controller
        control={control}
        name="governorate"
        render={({ field: f }) => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
            {GOVERNORATES.map((g) => <Chip key={g} label={g} active={f.value === g} onPress={() => f.onChange(g)} />)}
          </ScrollView>
        )}
      />
      <View style={{ height: 8 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -spacing.screen },
  chips: { gap: 10, paddingHorizontal: spacing.screen },
});
