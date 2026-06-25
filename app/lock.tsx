import { Redirect, type Href } from 'expo-router';
import { useAppStore } from '@/stores/appStore';
import { lockResolvePath } from '@/lib/lockHelpers';

/** Legacy route: per-app lock UI lives on `/app/[appId]`. */
export default function LockScreen() {
  const lock = useAppStore((s) => s.lock);
  return <Redirect href={lockResolvePath(lock) as Href} />;
}
