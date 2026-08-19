import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
};

export function OtpInput({ value, onChange, length = 6, disabled }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/\D/g, '').slice(0, length);
  const activeIndex = Math.min(digits.length, length - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} className="items-center">
      <View className="flex-row justify-center gap-2">
        {Array.from({ length }).map((_, i) => {
          const filled = digits[i] ?? '';
          const active = focused && i === activeIndex;
          return (
            <View
              key={i}
              className={cn(
                'h-14 w-11 items-center justify-center rounded-xl border bg-white/10',
                active ? 'border-scroll-accent' : 'border-scroll-border'
              )}>
              <Text className="font-display-semibold text-2xl text-scroll-text">
                {filled}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        editable={!disabled}
        caretHidden
        style={{
          position: 'absolute',
          opacity: 0,
          height: 1,
          width: 1,
          color: colors.text,
        }}
      />
    </Pressable>
  );
}
