import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/constants/theme';
import type { TrackedApp } from '@/types';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  getSelectableApps,
  hasAppListPermission,
  refreshDiscoveredApps,
  requestAppListPermission,
  searchSelectableApps,
} from '@/services/appDiscovery';

type Props = {
  selected: TrackedApp[];
  onChange: (apps: TrackedApp[]) => void;
};

export function AppPicker({ selected, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<TrackedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const loadApps = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    if (Platform.OS === 'android') {
      setPermissionGranted(true);
      const apps = forceRefresh
        ? await refreshDiscoveredApps()
        : await getSelectableApps();
      setCatalog(apps);
      setLoading(false);
      return;
    }
    const granted = await hasAppListPermission();
    setPermissionGranted(granted);
    const apps = await getSelectableApps();
    setCatalog(apps);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadApps(false);
  }, [loadApps]);

  const results = useMemo(
    () => searchSelectableApps(catalog, query),
    [catalog, query]
  );
  const selectedIds = new Set(selected.map((a) => a.id));

  const toggle = (app: TrackedApp) => {
    if (selectedIds.has(app.id)) {
      onChange(selected.filter((a) => a.id !== app.id));
    } else {
      onChange([...selected, app]);
    }
  };

  const grantAccess = async () => {
    setRequesting(true);
    await requestAppListPermission();
    setPermissionGranted(true);
    await loadApps();
    setRequesting(false);
  };

  if (!permissionGranted) {
    return (
      <View className="flex-1">
        <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
          SCROLL needs access to see which apps are on your phone so you can choose what to limit.
          We only ask once.
        </Text>
        <Button
          label="Allow app access"
          onPress={() => void grantAccess()}
          loading={requesting}
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
        {Platform.OS === 'android'
          ? 'Apps installed on this phone. Search or scroll to pick what SCROLL should block when you hit a limit.'
          : 'Select the apps you want SCROLL to monitor. System apps like Phone and Settings are hidden.'}
      </Text>
      <TextInput
        className="mb-2 rounded-scroll-md border border-scroll-border bg-scroll-card px-4 py-3 font-body text-scroll-text"
        placeholder="Search your apps..."
        placeholderTextColor={colors.textDim}
        value={query}
        onChangeText={setQuery}
      />
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-body text-xs text-scroll-dim">
          {selected.length} selected · {catalog.length} on device
        </Text>
        <Pressable onPress={() => void loadApps(true)}>
          <Text className="font-body-medium text-xs text-scroll-accent">Refresh list</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.iconActive} className="mt-8" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          className="flex-1"
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-8"
          ListEmptyComponent={
            <Text className="mt-6 font-body text-sm leading-5 text-scroll-dim">
              No apps found. Tap Refresh list. If still empty, allow Usage access for SCROLL in
              Android settings.
            </Text>
          }
          renderItem={({ item }) => {
            const on = selectedIds.has(item.id);
            return (
              <Pressable
                className={cn(
                  'flex-row items-center border-b border-scroll-border/50 px-1 py-3.5',
                  on && 'bg-scroll-accent-soft'
                )}
                onPress={() => toggle(item)}
              >
                <View className="flex-1">
                  <Text className="font-display-semibold text-base text-scroll-text">{item.name}</Text>
                  <Text className="mt-0.5 font-body text-xs capitalize text-scroll-dim">
                    {item.category}
                  </Text>
                </View>
                {on ? (
                  <ScrollIcon name="check" size={20} color={colors.iconActive} />
                ) : (
                  <View className="h-[22px] w-[22px] rounded-full border border-scroll-border" />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
