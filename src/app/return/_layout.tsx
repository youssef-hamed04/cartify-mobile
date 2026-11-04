import { Stack } from 'expo-router';
import { ReturnDraftProvider } from '@/features/returns/draft';
import { colors } from '@/theme';

export default function ReturnFlowLayout() {
  return (
    <ReturnDraftProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
        {/* The code screen is reached with router.replace, so going back must not re-enter the flow */}
        <Stack.Screen name="[id]" options={{ animation: 'fade' }} />
      </Stack>
    </ReturnDraftProvider>
  );
}
