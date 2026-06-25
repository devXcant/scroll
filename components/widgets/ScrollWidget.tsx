import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSummary } from '@/services/widgetData';

const BG = '#11131C';
const BORDER = '#2A2D3A';
const TEXT = '#F5F6FA';
const MUTED = '#9098B5';
const LOCK = '#FF6B6B';
const FREE = '#7C6CFF';

function formatUnlockTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ScrollWidget({ summary }: { summary: WidgetSummary }) {
  const { lockedCount, activeLockApp, lockEndsAt } = summary;
  const unlockTime = formatUnlockTime(lockEndsAt);
  const isLocked = lockedCount > 0;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: BG,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget
          text="SCROLL"
          style={{ color: MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column', marginTop: 8 }}>
        <TextWidget
          text={lockedCount === 1 ? '1 app locked' : `${lockedCount} apps locked`}
          style={{ color: TEXT, fontSize: 18, fontWeight: '700' }}
        />
        {isLocked && activeLockApp ? (
          <TextWidget
            text={activeLockApp}
            style={{ color: MUTED, fontSize: 12, marginTop: 2 }}
            maxLines={1}
          />
        ) : null}
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column' }}>
        {isLocked && unlockTime ? (
          <TextWidget
            text={`Unlocks at ${unlockTime}`}
            style={{ color: LOCK, fontSize: 14, fontWeight: '600' }}
          />
        ) : (
          <TextWidget
            text="All within limits"
            style={{ color: FREE, fontSize: 14, fontWeight: '600' }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}
