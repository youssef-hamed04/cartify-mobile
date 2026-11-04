import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, fonts, radius } from '@/theme';
import { Text } from './Text';

interface TextFieldProps extends TextInputProps {
  icon?: ReactNode;
  label?: string;
  error?: string;
  secure?: boolean;
  right?: ReactNode;
}

// Pill input from the design: 56px, bg #f7f8f9, 1px border, 28 radius, 20px padding, 20px icon
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { icon, label, error, secure, right, style, multiline, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      {label ? <Text size={13} weight="semibold" color={colors.body}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          focused && { borderColor: colors.indigo, backgroundColor: colors.white },
          !!error && { borderColor: colors.danger },
        ]}
      >
        {icon}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          secureTextEntry={secure && hidden}
          multiline={multiline}
          {...rest}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[styles.input, multiline && { textAlignVertical: 'top', minHeight: 72 }, style]}
          accessibilityLabel={rest.accessibilityLabel ?? label ?? rest.placeholder}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            {hidden ? <Eye size={20} color={colors.muted} /> : <EyeOff size={20} color={colors.muted} />}
          </Pressable>
        ) : right}
      </View>
      {error ? <Text size={12} color={colors.danger}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6, alignSelf: 'stretch' },
  field: {
    minHeight: 56,
    borderRadius: radius.input,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  multiline: { borderRadius: radius.xl, alignItems: 'flex-start', paddingVertical: 14 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: 12 },
});
