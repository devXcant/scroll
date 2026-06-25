import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  loading?: boolean;
  bottom: number;
};

export function CoachComposer({ value, onChange, onSend, loading, bottom }: Props) {
  return (
    <View style={[styles.shell, { bottom }]}>
      <View style={styles.bar}>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Message Coach..."
            placeholderTextColor={colors.textDim}
            value={value}
            onChangeText={onChange}
            multiline
            editable={!loading}
          />
          <Pressable
            disabled={loading || !value.trim()}
            onPress={onSend}
            style={[styles.send, (loading || !value.trim()) && styles.sendDisabled]}>
            {loading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <ScrollIcon name="send" size={18} color={colors.text} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  bar: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sendDisabled: {
    opacity: 0.35,
  },
});
