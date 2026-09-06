import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/colors';

export function useTheme() {
  const darkMode = useStore((s) => s.darkMode);
  return darkMode ? Colors.dark : Colors.light;
}
