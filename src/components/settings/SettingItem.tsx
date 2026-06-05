import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type SettingItemProps = {
  label: string;
  subtitle?: string;
  icon?: LucideIcon;
  value?: string;
  onPress?: () => void;
  toggle?: {
    value: boolean;
    onValueChange: (next: boolean) => void;
  };
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
};

/** Single row inside a settings group — navigation, toggle, or read-only value. */
export function SettingItem({
  label,
  subtitle,
  icon: Icon,
  value,
  onPress,
  toggle,
  destructive = false,
  disabled = false,
  showChevron = Boolean(onPress && !toggle),
  isLast = false,
}: SettingItemProps) {
  const { colors } = useTheme();
  const interactive = Boolean(onPress || toggle) && !disabled;
  const labelColor = destructive ? colors.danger : colors.foreground;
  const iconColor = destructive ? colors.danger : colors.primary;

  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </View>
      ) : null}

      <View style={styles.textCol}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={2}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.trailing}>
        {toggle ? (
          <Switch
            value={toggle.value}
            onValueChange={toggle.onValueChange}
            disabled={disabled}
            trackColor={{ false: colors.chipInactive, true: `${colors.primary}99` }}
            thumbColor={toggle.value ? colors.primary : colors.foregroundSecondary}
          />
        ) : value ? (
          <Text style={[styles.value, { color: colors.muted }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {showChevron && onPress ? (
          <ChevronRight
            size={18}
            color={colors.muted}
            strokeWidth={2}
            style={{ marginLeft: spacing[1] }}
          />
        ) : null}
      </View>
    </View>
  );

  if (!interactive) {
    return content;
  }

  if (toggle) {
    return (
      <Pressable
        onPress={() => toggle.onValueChange(!toggle.value)}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked: toggle.value, disabled }}
        accessibilityLabel={label}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minHeight: 56,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  textCol: {
    flex: 1,
    marginRight: spacing[2],
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '42%',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
  },
});
