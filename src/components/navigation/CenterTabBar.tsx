import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

const SCANNER_ROUTE = 'scanner';

type CenterTabBarProps = BottomTabBarProps & {
  scannerLabel?: string;
};

/** Bottom tabs with a raised center action for scan (members) / gym QR (owners). */
export function CenterTabBar({
  state,
  descriptors,
  navigation,
  scannerLabel = 'Scan',
}: CenterTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 10),
        paddingHorizontal: 8,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? String(options.tabBarLabel)
            : options.title !== undefined
              ? String(options.title)
              : route.name;

        const isFocused = state.index === index;
        const isScanner = route.name === SCANNER_ROUTE;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const tint = isFocused ? colors.tabActive : colors.tabInactive;
        const icon = options.tabBarIcon?.({
          focused: isFocused,
          color: isScanner ? '#ffffff' : tint,
          size: isScanner ? 26 : 22,
        });

        if (isScanner) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? scannerLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -22,
                minWidth: 72,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  borderWidth: 3,
                  borderColor: colors.surface,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                {icon}
              </View>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  fontWeight: isFocused ? '700' : '500',
                  color: isFocused ? colors.tabActive : colors.tabInactive,
                }}
              >
                {scannerLabel}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
              minHeight: 48,
            }}
          >
            {icon}
            <Text
              style={{
                marginTop: 2,
                fontSize: 11,
                fontWeight: isFocused ? '600' : '500',
                color: tint,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
