import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import type { ReturnReason } from '@/api';
import { Button } from '@/components/Button';
import { Screen, StickyFooter } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { FlowHeader } from '@/features/returns/FlowHeader';
import { useReturnDraft } from '@/features/returns/draft';
import { returnReasonLabel } from '@/lib/format';
import { colors } from '@/theme';

// Design options first, then the backend's extra "wrong_size" reason
const REASONS: ReturnReason[] = ['changed_mind', 'wrong_item', 'defective', 'wrong_size', 'other'];
const NOTE_MAX = 1000;

// Figma 28 · Return 2 · Reason
export default function ReasonScreen() {
  const draft = useReturnDraft();

  // Deep link or reload without picked items: restart the flow
  useEffect(() => {
    if (!draft.items.length) router.replace('/return/select');
  }, [draft.items.length]);

  return (
    <Screen
      footer={
        <StickyFooter>
          <Button
            title="Continue"
            disabled={!draft.reason}
            icon={<ArrowRight size={20} color={colors.white} />}
            onPress={() => router.push('/return/method')}
          />
        </StickyFooter>
      }
    >
      <FlowHeader step={2} label="Reason" title={'Why are you\nreturning it?'} subtitle="This helps us improve. It only takes a second." />
      <View style={{ gap: 12 }} accessibilityRole="radiogroup">
        {REASONS.map((reason) => {
          const active = draft.reason === reason;
          return (
            <Pressable
              key={reason}
              onPress={() => draft.setReason(reason)}
              style={[styles.option, active && styles.optionActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text size={16} weight="bold" style={{ flex: 1 }}>{returnReasonLabel[reason]}</Text>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ marginTop: 24 }}>
        <TextField
          multiline
          placeholder="Add a note (optional)"
          value={draft.notes}
          onChangeText={draft.setNotes}
          maxLength={NOTE_MAX}
          accessibilityLabel="Note"
        />
        {draft.notes.length > NOTE_MAX - 100 ? (
          <Text size={12} color={colors.muted} align="right" style={{ marginTop: 6 }}>{draft.notes.length}/{NOTE_MAX}</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { height: 62, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  optionActive: { backgroundColor: colors.lavender, borderWidth: 2, borderColor: colors.indigo, paddingHorizontal: 19 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.navy },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.navy },
});
