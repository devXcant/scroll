/** @type {import('expo/config').ExpoConfig} */
const app = require('./app.json');

const APP_GROUP = 'group.com.scroll.app.blocker';

module.exports = {
  expo: {
    ...app.expo,
    ios: {
      ...app.expo.ios,
      ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {}),
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
    android: {
      ...app.expo.android,
      permissions: [
        ...(app.expo.android?.permissions ?? []),
        'android.permission.QUERY_ALL_PACKAGES',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.POST_NOTIFICATIONS',
      ],
      queries: [
        {
          intent: {
            action: 'android.intent.action.MAIN',
            category: ['android.intent.category.LAUNCHER'],
          },
        },
      ],
    },
    plugins: [
      ...(app.expo.plugins ?? []).filter((p) => p !== 'expo-app-blocker'),
      'expo-web-browser',
      'expo-apple-authentication',
      [
        'expo-app-blocker',
        {
          ios: {
            appGroup: APP_GROUP,
            shield: {
              title: 'SCROLL',
              subtitle: '{appName} is locked. Open SCROLL to earn time back.',
              primaryButtonLabel: 'Open SCROLL',
              primaryButtonColor: '#7C6CFF',
              backgroundBlurStyle: 'systemThickMaterialDark',
            },
          },
        },
      ],
      [
        'react-native-android-widget',
        {
          widgets: [
            {
              name: 'ScrollWidget',
              label: 'SCROLL',
              description: 'Shows how many apps are locked and when they unlock.',
              minWidth: '180dp',
              minHeight: '110dp',
              targetCellWidth: 3,
              targetCellHeight: 2,
              resizeMode: 'horizontal|vertical',
              updatePeriodMillis: 1800000,
            },
          ],
        },
      ],
    ],
  },
};
