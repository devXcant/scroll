import { Platform } from 'react-native';
import { isExpoGo } from '@/lib/expoGo';

type NotificationsModule = typeof import('expo-notifications');

function notifications(): NotificationsModule | null {
  if (isExpoGo()) return null;
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

export function configureNotifications(): void {
  const N = notifications();
  if (!N) return;

  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    void N.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
}

export async function requestNotificationsPermission(): Promise<boolean> {
  const N = notifications();
  if (!N) return false;

  const current = await N.getPermissionsAsync();
  const currentGranted =
    'granted' in current && typeof current.granted === 'boolean'
      ? current.granted
      : 'status' in current && typeof current.status === 'string'
        ? current.status === 'granted'
        : false;
  if (currentGranted) return true;

  const next = await N.requestPermissionsAsync();
  const nextGranted =
    'granted' in next && typeof next.granted === 'boolean'
      ? next.granted
      : 'status' in next && typeof next.status === 'string'
        ? next.status === 'granted'
        : false;
  return nextGranted;
}

export async function notifyLockTriggered(appName: string): Promise<void> {
  const N = notifications();
  if (!N) return;

  await N.scheduleNotificationAsync({
    content: {
      title: `${appName} locked`,
      body: 'Open SCROLL to earn time back (read, learn, points, or pay grace).',
    },
    trigger: null,
  });
}

export async function notifyLockTimerFinished(appName: string): Promise<void> {
  const N = notifications();
  if (!N) return;

  await N.scheduleNotificationAsync({
    content: {
      title: `${appName} timer finished`,
      body: 'Open SCROLL to read, learn, spend points, or pay to unlock.',
    },
    trigger: null,
  });
}

export async function scheduleLockTimerNotification(
  appName: string,
  fireAt: string
): Promise<string | null> {
  const N = notifications();
  if (!N) return null;

  try {
    return await N.scheduleNotificationAsync({
      content: {
        title: `${appName} timer finished`,
        body: 'Open SCROLL to read, learn, spend points, or pay to unlock.',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    });
  } catch {
    return null;
  }
}

export async function cancelScheduledNotification(id: string | null | undefined): Promise<void> {
  if (!id) return;
  const N = notifications();
  if (!N) return;

  try {
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    /* ignore */
  }
}
