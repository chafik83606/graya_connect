import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Visible tab bar content height (icons + labels), excluding system inset. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

/** Minimum lift above system navigation — Android often reports 0 insets incorrectly. */
export function getBottomInset(insetsBottom: number) {
  if (Platform.OS === 'android') {
    return Math.max(insetsBottom, 48);
  }
  return Math.max(insetsBottom, 0);
}

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = getBottomInset(insets.bottom);
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomInset;

  return {
    bottomInset,
    tabBarHeight,
    tabBarPaddingBottom: Math.max(bottomInset, 8),
    fabBottom: tabBarHeight + 16,
    miniPlayerBottom: tabBarHeight,
    listPaddingBottom: tabBarHeight + 80,
  };
}
