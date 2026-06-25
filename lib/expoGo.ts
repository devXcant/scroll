import Constants from 'expo-constants';

/** True when running inside the App Store / Play Store Expo Go app */
export function isExpoGo(): boolean {
  return (
    Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo'
  );
}
