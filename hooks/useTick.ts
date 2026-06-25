import { useEffect, useState } from 'react';

/** Re-render every second for live countdowns */
export function useTick(active = true): number {
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return tick;
}
