import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  href: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Opens external URLs — not an in-app route (avoids typed-route errors). */
export function ExternalLink({ href, children, style }: Props) {
  if (Platform.OS === 'web') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        {children}
      </a>
    );
  }

  return (
    <Pressable
      style={style}
      onPress={() => {
        void WebBrowser.openBrowserAsync(href);
      }}
    >
      {children}
    </Pressable>
  );
}
