import { Text, View } from 'react-native';

type Props = {
  used: number;
  limit: number;
};

export function TodaySplitBar({ used, limit }: Props) {
  const cap = Math.max(limit, used, 1);
  const usedPct = Math.min(100, (used / cap) * 100);
  const remain = Math.max(0, limit - used);
  const remainPct = limit > 0 ? Math.min(100 - usedPct, (remain / cap) * 100) : 0;
  const over = Math.max(0, used - limit);
  const overPct = over > 0 ? Math.min(100, (over / cap) * 100) : 0;

  return (
    <View>
      <View className="h-3 overflow-hidden rounded-full bg-white/10">
        <View className="absolute left-0 top-0 h-full bg-[#4C8DFF]" style={{ width: `${usedPct}%` }} />
        {remainPct > 0 ? (
          <View
            className="absolute top-0 h-full bg-white/20"
            style={{ left: `${usedPct}%`, width: `${remainPct}%` }}
          />
        ) : null}
        {overPct > 0 ? (
          <View
            className="absolute top-0 h-full bg-scroll-accent"
            style={{ left: `${Math.min(100, (limit / cap) * 100)}%`, width: `${overPct}%` }}
          />
        ) : null}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="font-body text-[11px] text-[#8BB4FF]">{used}m used</Text>
        <Text className="font-body text-[11px] text-scroll-muted">
          {remain > 0 ? `${remain}m left` : 'At your limit'}
        </Text>
      </View>
    </View>
  );
}
