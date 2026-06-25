import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { ScrollWidget } from '@/components/widgets/ScrollWidget';
import { EMPTY_WIDGET_SUMMARY, WIDGET_STORAGE_KEY, type WidgetSummary } from '@/services/widgetData';

async function loadSummary(): Promise<WidgetSummary> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) return EMPTY_WIDGET_SUMMARY;
    return JSON.parse(raw) as WidgetSummary;
  } catch {
    return EMPTY_WIDGET_SUMMARY;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const summary = await loadSummary();

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(<ScrollWidget summary={summary} />);
      break;
    default:
      break;
  }
}
