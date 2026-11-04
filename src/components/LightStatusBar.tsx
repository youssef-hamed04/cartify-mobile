import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';

// White status bar text while a screen with a dark hero is focused; restores dark text on blur.
// Focus-based (not mount-based) because tab screens stay mounted after you leave them.
export function LightStatusBar() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );
  return null;
}
