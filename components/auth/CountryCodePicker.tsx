import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import {
  COUNTRY_CODES,
  type CountryCode,
} from '@/constants/countryCodes';
import { cn } from '@/lib/cn';

type Props = {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
  disabled?: boolean;
};

export function CountryCodePicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          'h-[52px] min-w-[108px] flex-row items-center justify-center gap-1 rounded-xl border border-scroll-border bg-scroll-surface px-3 active:opacity-90',
          disabled && 'opacity-50'
        )}>
        <Text className="text-lg">{value.flag}</Text>
        <Text className="font-body-medium text-scroll-text">+{value.dial}</Text>
        <ScrollIcon name="chevron-down" size={14} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/70" onPress={() => setOpen(false)}>
          <Pressable className="mt-auto max-h-[78%] rounded-t-[28px] border border-scroll-border bg-scroll-elevated px-4 pb-8 pt-4" onPress={() => {}}>
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-scroll-border" />
            <Text className="mb-3 font-display-semibold text-xl text-scroll-text">Country code</Text>
            <TextInput
              className="mb-3 rounded-xl border border-scroll-border bg-scroll-surface px-4 py-3 font-body text-scroll-text"
              placeholder="Search country or code"
              placeholderTextColor={colors.textDim}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.iso}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  className={cn(
                    'flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-scroll-surface',
                    item.iso === value.iso && 'bg-scroll-surface'
                  )}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                    setQuery('');
                  }}>
                  <Text className="text-xl">{item.flag}</Text>
                  <View className="flex-1">
                    <Text className="font-body-medium text-scroll-text">{item.name}</Text>
                    <Text className="font-body text-sm text-scroll-muted">+{item.dial}</Text>
                  </View>
                  {item.iso === value.iso ? (
                    <ScrollIcon name="check" size={18} color={colors.accent} />
                  ) : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
