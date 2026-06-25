import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

/** Prevents foreground / usage polling from yanking user back to /lock mid-read. */
export function useUnlockFlowGuard() {
  useEffect(() => {
    useAppStore.getState().setUnlockFlowActive(true);
    return () => {
      useAppStore.getState().setUnlockFlowActive(false);
    };
  }, []);
}
