import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// White status bar text while a screen with a dark hero is focused. Rendered as a component
// (not setStatusBarStyle) so it outranks the root layout's <StatusBar style="dark" />, and
// focus-based because tab and stack screens stay mounted after you leave them.
export function LightStatusBar() {
  const focused = useIsFocused();
  return <StatusBar style={focused ? 'light' : 'dark'} />;
}
