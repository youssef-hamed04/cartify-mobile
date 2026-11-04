import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Banknote, Check, CreditCard, Mail, MapPin, Phone, ShieldCheck, Smartphone, Truck, User as UserIcon, Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { Divider } from '@/components/Misc';
import { BackButton, Screen, StickyFooter } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { SummaryRow } from '@/features/orders/SummaryRow';
import { useCart, useCreateOrder, useShippingRates } from '@/hooks/queries';
import { GOVERNORATES, money } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { colors, spacing } from '@/theme';

// Mirrors the backend createOrderRules (src/middleware/validation.js)
const schema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: z.string().trim().regex(/^[A-Za-z0-9._%+-]{2,}@[A-Za-z0-9.-]+\.(com)$/, 'Enter a valid .com email address'),
  phone: z.string().trim().regex(/^(010|011|012|015)[0-9]{8}$/, 'Enter a valid Egyptian mobile number (e.g. 01012345678)'),
  address: z.string().trim().min(5, 'Address is too short'),
  city: z.string().trim().min(2, 'City is required'),
  governorate: z.string().refine((g) => (GOVERNORATES as readonly string[]).includes(g), 'Choose your governorate'),
  notes: z.string().trim().max(500, 'Notes must be 500 characters or less'),
});
type FormValues = z.infer<typeof schema>;

export default function CheckoutScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const cart = useCart();
  const rates = useShippingRates();
  const createOrder = useCreateOrder();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaults: FormValues = {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    city: user?.city ?? '',
    governorate: user?.governorate && (GOVERNORATES as readonly string[]).includes(user.governorate) ? user.governorate : '',
    notes: '',
  };
  const savedAddressValid = schema.safeParse(defaults).success;
  const [editingAddress, setEditingAddress] = useState(!savedAddressValid);

  const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const governorate = watch('governorate');
  const values = watch();
  const items = useMemo(() => (cart.data?.cart.items ?? []).filter((i) => i.productId), [cart.data]);
  const itemCount = cart.data?.totalQuantity ?? 0;
  const subtotal = cart.data?.subtotal ?? 0;
  const shipping = governorate && rates.data ? rates.data[governorate] ?? rates.data.default : undefined;
  const total = subtotal + (shipping ?? 0);
  const addressDone = isValid || (!editingAddress && savedAddressValid);

  const onValid = (data: FormValues) => {
    setSubmitError(null);
    createOrder.mutate(
      { ...data, notes: data.notes || undefined, paymentMethod: 'cash' },
      {
        onSuccess: (order) => router.replace(`/order-confirmed/${order._id}`),
        onError: (e) => {
          setSubmitError(errorMessage(e));
          toast.show(errorMessage(e), 'error');
        },
      },
    );
  };
  const onInvalid = () => {
    setEditingAddress(true);
    toast.show('Please check your delivery details', 'error');
  };

  const header = (
    <View style={styles.header}>
      <BackButton />
      <View style={{ alignItems: 'center' }}>
        <Text size={22} weight="bold" tracking={-0.22} accessibilityRole="header">Checkout</Text>
        <Text size={13} color={colors.muted}>{itemCount} {itemCount === 1 ? 'item' : 'items'} · {money(total)}</Text>
      </View>
      <View style={{ width: 44 }} />
    </View>
  );

  if (cart.isLoading) return <Screen scroll={false} header={header}><LoadingView /></Screen>;
  if (cart.error && !cart.data) return <Screen scroll={false} header={header}><ErrorView error={cart.error} onRetry={() => cart.refetch()} /></Screen>;
  if (!items.length) {
    return (
      <Screen scroll={false} header={header}>
        <EmptyView title="Your cart is empty" message="Add products before checking out." action={<Button title="Browse products" onPress={() => router.replace('/shop')} />} />
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      edges={['top']}
      contentStyle={styles.content}
      footer={
        <StickyFooter>
          <View style={styles.footerRow}>
            <View>
              <Text size={13} color={colors.muted}>Total</Text>
              <Text size={24} weight="bold" color={colors.navy} tracking={-0.48}>{money(total)}</Text>
            </View>
            <Button
              title="Place Order"
              height={56}
              style={{ flex: 1 }}
              loading={createOrder.isPending}
              onPress={handleSubmit(onValid, onInvalid)}
              leftIcon={<ShieldCheck size={20} color={colors.white} />}
            />
          </View>
        </StickyFooter>
      }
    >
      <Progress addressDone={addressDone} />

      {/* Delivery address */}
      <View style={styles.sectionHeader}>
        <Text size={17} weight="bold" tracking={-0.17}>Delivery address</Text>
        {savedAddressValid ? (
          <Pressable onPress={() => setEditingAddress((v) => !v)} hitSlop={10} accessibilityRole="button">
            <Text size={14} weight="bold" color={colors.indigo}>{editingAddress ? 'Done' : 'Change'}</Text>
          </Pressable>
        ) : null}
      </View>

      {!editingAddress ? (
        <OptionCard
          Icon={MapPin}
          title={`${values.firstName} ${values.lastName}`.trim()}
          subtitle={`${values.address}, ${values.city}, ${values.governorate}\n${values.phone}`}
          selected
          onPress={() => setEditingAddress(true)}
        />
      ) : (
        <View style={styles.form}>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Field name="firstName" control={control} error={errors.firstName?.message} placeholder="First name" icon={UserIcon} autoComplete="given-name" textContentType="givenName" />
            </View>
            <View style={{ flex: 1 }}>
              <Field name="lastName" control={control} error={errors.lastName?.message} placeholder="Last name" autoComplete="family-name" textContentType="familyName" />
            </View>
          </View>
          <Field name="email" control={control} error={errors.email?.message} placeholder="name@example.com" icon={Mail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <Field name="phone" control={control} error={errors.phone?.message} placeholder="01012345678" icon={Phone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={11} />
          <Field name="address" control={control} error={errors.address?.message} placeholder="Street, building, apartment" icon={MapPin} autoComplete="street-address" textContentType="fullStreetAddress" />
          <Field name="city" control={control} error={errors.city?.message} placeholder="City / area" autoComplete="postal-address-locality" textContentType="addressCity" />
          <Text size={13} weight="semibold" color={colors.body}>Governorate</Text>
          <Controller
            control={control}
            name="governorate"
            render={({ field: { value, onChange } }) => (
              <View style={styles.govWrap}>
                {GOVERNORATES.map((g) => {
                  const active = value === g;
                  return (
                    <Pressable
                      key={g}
                      onPress={() => onChange(g)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[styles.gov, active ? styles.govActive : null]}
                    >
                      <Text size={13} weight="bold" color={active ? colors.white : colors.ink}>{g}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          {errors.governorate?.message ? <Text size={12} color={colors.danger}>{errors.governorate.message}</Text> : null}
        </View>
      )}

      {/* Shipping */}
      <Text size={17} weight="bold" tracking={-0.17} style={styles.sectionTitle}>Shipping method</Text>
      <OptionCard
        Icon={Truck}
        title="Standard"
        subtitle={governorate ? `Delivery to ${governorate}` : 'Choose your governorate to see the price'}
        trailing={
          shipping === undefined ? (rates.isLoading ? '…' : '—') : shipping === 0 ? 'Free' : money(shipping)
        }
        trailingColor={shipping === 0 ? colors.success : colors.ink}
        selected
      />

      {/* Payment */}
      <Text size={17} weight="bold" tracking={-0.17} style={styles.sectionTitle}>Payment</Text>
      <View style={{ gap: 10 }}>
        <OptionCard Icon={Banknote} title="Cash on delivery" subtitle="Pay when your order arrives" selected />
        <OptionCard Icon={CreditCard} title="Credit / debit card" subtitle="Coming soon" disabled />
        <OptionCard Icon={Smartphone} title="InstaPay / Vodafone Cash" subtitle="Coming soon" disabled />
        <OptionCard Icon={Wallet} title="Cartify Wallet" subtitle="Coming soon" disabled />
      </View>

      {/* Notes */}
      <Text size={17} weight="bold" tracking={-0.17} style={styles.sectionTitle}>Order notes</Text>
      <Field name="notes" control={control} error={errors.notes?.message} placeholder="Delivery instructions (optional)" multiline maxLength={500} />

      {/* Summary */}
      <View style={styles.summary}>
        {items.map((i) => (
          <SummaryRow
            key={`${i.productId!._id}-${i.color}`}
            size={14}
            label={`${i.quantity} × ${i.productId!.name}${i.productId!.variants.length > 1 ? ` (${i.color})` : ''}`}
            value={money(i.productId!.finalPrice * i.quantity)}
          />
        ))}
        <Divider />
        <SummaryRow label="Subtotal" value={money(subtotal)} />
        <SummaryRow label="Shipping" value={shipping === undefined ? '—' : shipping === 0 ? 'Free' : money(shipping)} valueColor={shipping === 0 ? colors.success : colors.ink} />
        <Divider />
        <View style={styles.totalRow}>
          <Text size={18} weight="bold">Total</Text>
          <Text size={22} weight="bold" color={colors.navy}>{money(total)}</Text>
        </View>
      </View>

      {submitError ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Text color={colors.danger} weight="medium">{submitError}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function Progress({ addressDone }: { addressDone: boolean }) {
  const steps = [
    { label: 'Address', done: addressDone, current: !addressDone },
    { label: 'Shipping', done: addressDone, current: false },
    { label: 'Payment', done: false, current: addressDone },
  ];
  return (
    <View style={styles.progress}>
      {steps.map((s, i) => (
        <View key={s.label} style={styles.progressItem}>
          {i > 0 ? <View style={[styles.progressLine, { backgroundColor: steps[i - 1].done ? colors.navy : colors.border }]} /> : null}
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View
              style={[
                styles.progressDot,
                s.done ? { backgroundColor: colors.navy } : s.current ? { backgroundColor: colors.navy, borderWidth: 3, borderColor: colors.indigo } : { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
              ]}
            >
              {s.done ? <Check size={18} color={colors.white} strokeWidth={2.5} /> : <Text size={15} weight="bold" color={s.current ? colors.white : colors.muted}>{i + 1}</Text>}
            </View>
            <Text size={12} weight={s.done || s.current ? 'bold' : 'medium'} color={s.done || s.current ? colors.ink : colors.muted}>{s.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

interface OptionCardProps {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: string;
  trailingColor?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

// Selectable option row from the design (lavender + indigo border when selected)
function OptionCard({ Icon, title, subtitle, trailing, trailingColor = colors.ink, selected, disabled, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[styles.option, selected ? styles.optionSelected : styles.optionIdle, disabled && { opacity: 0.55 }]}
    >
      <View style={[styles.optionIcon, { backgroundColor: selected ? colors.navy : colors.lavender }]}>
        <Icon size={22} color={selected ? colors.white : colors.navy} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text size={15} weight="bold" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text size={13} color={colors.muted} lineHeight={18}>{subtitle}</Text> : null}
      </View>
      {trailing ? <Text size={15} weight="bold" color={trailingColor}>{trailing}</Text> : null}
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}

type FieldProps = Omit<React.ComponentProps<typeof TextField>, 'icon' | 'value' | 'onChangeText' | 'onBlur'> & {
  name: keyof FormValues;
  control: ReturnType<typeof useForm<FormValues>>['control'];
  icon?: LucideIcon;
};

function Field({ name, control, icon: Icon, ...rest }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur } }) => (
        <TextField {...rest} value={value} onChangeText={onChange} onBlur={onBlur} icon={Icon ? <Icon size={20} color={colors.muted} /> : undefined} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 16 },
  content: { gap: 16, paddingBottom: 40 },
  progress: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  progressItem: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, justifyContent: 'flex-end' },
  progressLine: { flex: 1, height: 3, borderRadius: 2, marginTop: 17, marginHorizontal: 6 },
  progressDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { marginTop: 8 },
  form: { gap: 12 },
  twoCol: { flexDirection: 'row', gap: 12 },
  govWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gov: { height: 38, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  govActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 14, paddingRight: 16, paddingVertical: 14, borderRadius: 24 },
  optionSelected: { backgroundColor: colors.lavender, borderWidth: 2, borderColor: colors.indigo },
  optionIdle: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.navy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
  summary: { backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 10, marginTop: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  errorBox: { backgroundColor: colors.dangerBg, borderRadius: 16, padding: 14 },
});
