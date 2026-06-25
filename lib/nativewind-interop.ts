import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { loadAppBlocker } from '@/lib/appBlocker';

cssInterop(LinearGradient, { className: 'style' });
cssInterop(BlurView, { className: 'style' });
cssInterop(MotiView, { className: 'style' });

const blocker = loadAppBlocker();
if (blocker?.FamilyActivityPickerView) {
  cssInterop(blocker.FamilyActivityPickerView, { className: 'style' });
}
