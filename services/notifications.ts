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

export async function getNotificationsGranted(): Promise<boolean> {
  const N = notifications();
  if (!N) return false;
  try {
    const current = await N.getPermissionsAsync();
    if ('granted' in current && typeof current.granted === 'boolean') return current.granted;
    if ('status' in current && typeof current.status === 'string') return current.status === 'granted';
    return false;
  } catch {
    return false;
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

export async function notifyLockTriggered(appName: string, appId?: string): Promise<void> {
  const N = notifications();
  if (!N) return;

  await N.scheduleNotificationAsync({
    content: {
      title: `${appName} locked`,
      body: 'Open SCROLL to read, learn, or pay for a short unlock.',
      data: { url: appId ? `/app/${encodeURIComponent(appId.replace(/\./g, '~'))}` : '/(tabs)' },
    },
    trigger: null,
  });
}

export async function notifyLockTimerFinished(appName: string, appId?: string): Promise<void> {
  const N = notifications();
  if (!N) return;

  await N.scheduleNotificationAsync({
    content: {
      title: `${appName} timer finished`,
      body: 'Open SCROLL to read, learn, or pay for a short unlock.',
      data: { url: appId ? `/app/${encodeURIComponent(appId.replace(/\./g, '~'))}` : '/unlock/read' },
    },
    trigger: null,
  });
}

export async function scheduleLockTimerNotification(
  appName: string,
  fireAt: string,
  appId?: string
): Promise<string | null> {
  const N = notifications();
  if (!N) return null;

  try {
    return await N.scheduleNotificationAsync({
      content: {
        title: `${appName} timer finished`,
        body: 'Open SCROLL to read, learn, or pay for a short unlock.',
        data: { url: appId ? `/app/${encodeURIComponent(appId.replace(/\./g, '~'))}` : '/unlock/read' },
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

export function subscribeNotificationResponses(onUrl: (url: string) => void): () => void {
  const N = notifications();
  if (!N) return () => undefined;

  const sub = N.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const url =
      data && typeof data === 'object' && 'url' in data ? (data as { url?: unknown }).url : null;
    if (typeof url === 'string' && url.length > 0) onUrl(url);
  });

  return () => sub.remove();
}

export async function scheduleDailyCoachReminder(enabled: boolean, topic?: string): Promise<void> {
  const N = notifications();
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync('daily-coach');
  } catch {
    /* ignore */
  }
  if (!enabled) return;
  const body = topic
    ? `You have not read today. A few pages on ${topic} beats another scroll.`
    : 'You have not read today. Open SCROLL and earn a few pages.';
  try {
    await N.scheduleNotificationAsync({
      identifier: 'daily-coach',
      content: {
        title: 'SCROLL',
        body,
        data: { url: '/unlock/read' },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 30,
      },
    });
  } catch {
    /* ignore */
  }
}
