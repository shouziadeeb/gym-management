import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { systemBottomInset } from '@/lib/safe-area';
import { getBottomChromeColor } from '@/lib/system-chrome';

const SCANNER_ROUTE = 'scanner';

type CenterTabBarProps = BottomTabBarProps & {
  scannerLabel?: string;
};

/** Bottom tabs with a raised center action for scan (members) / gym QR (owners). */
export function CenterTabBar({
  state,
  descriptors,
  navigation,
  insets,
  scannerLabel = 'Scan',
}: CenterTabBarProps) {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const chromeColor = getBottomChromeColor(colors, isDark);
  const bottomInset = systemBottomInset(insets);
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const tabRowBottomPadding = Platform.OS === 'ios' ? 8 : 10;
  const rowBottomPadding = isDesktopWeb ? 8 : tabRowBottomPadding;
  const rowMaxWidth = isDesktopWeb ? 960 : undefined;
  const scannerButtonSize = isDesktopWeb ? 52 : 56;
  const scannerLift = isDesktopWeb ? -12 : -30;
  const itemLabelSize = isDesktopWeb ? 11 : 8;

  return (
    <View
      style={{
        backgroundColor: chromeColor,
        paddingHorizontal: isDesktopWeb ? 20 : 0,
        paddingBottom: isDesktopWeb ? 14 : 0,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          alignSelf: isDesktopWeb ? 'center' : 'stretch',
          width: '100%',
          maxWidth: rowMaxWidth,
          paddingTop: isDesktopWeb ? 10 : 8,
          paddingBottom: rowBottomPadding,
          paddingHorizontal: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 0.3,
          borderTopColor: colors.border,
          ...(isDesktopWeb
            ? {
                borderRadius: 18,
                borderWidth: 1,
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 5 },
                elevation: 8,
              }
            : null),
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
                  marginTop: scannerLift,
                  minWidth: 72,
                }}
              >
                <View
                  style={{
                    width: scannerButtonSize,
                    height: scannerButtonSize,
                    borderRadius: scannerButtonSize / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                    borderWidth: 3,
                    borderColor: chromeColor,
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
                    fontSize: isDesktopWeb ? 12 : 11,
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
                paddingVertical: isDesktopWeb ? 6 : 2,
                minHeight: isDesktopWeb ? 54 : 48,
              }}
            >
              {icon}
              <Text
                style={{
                  marginTop: 1,
                  fontSize: itemLabelSize,
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

      {/* Edge-to-edge Android: paint the gesture-nav region with the same chrome color. */}
      <View style={{ height: isDesktopWeb ? 0 : bottomInset, backgroundColor: chromeColor }} />
    </View>
  );
}
