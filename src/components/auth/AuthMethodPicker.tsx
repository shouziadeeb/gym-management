/**
 * @file AuthMethodPicker.tsx
 * Initial auth method choice (phone, email, Google) and inline switch between methods.
 */
import { Mail, Smartphone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { GoogleMark } from '@/components/auth/GoogleMark';
import { useTheme } from '@/hooks/useTheme';
import type { AuthMethod } from '@/services/auth/auth.types';
import { palette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { layout, text } from '@/theme/classes';

const PRIMARY_BLUE = palette.emerald400;

type AuthMethodButtonProps = {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
};

/**
 * Paint button chrome on an inner View — Pressable alone often drops bg/border on Android.
 */
function AuthMethodButton({
  label,
  icon,
  onPress,
  variant = 'outline',
  loading = false,
  disabled = false,
  containerStyle,
}: AuthMethodButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  const faceStyle: ViewStyle = isPrimary
    ? {
        backgroundColor: PRIMARY_BLUE,
        borderWidth: 0,
        shadowColor: PRIMARY_BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius: 14,
        elevation: 8,
      }
    : {
        backgroundColor: 'rgba(0, 0, 0, 0.42)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.22)',
      };

  return (
    <View style={[styles.buttonSlot, containerStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.14)' }}
        style={({ pressed }) => [styles.buttonPressable, pressed && styles.buttonPressed]}
      >
        <View style={[styles.buttonFace, faceStyle]}>
          {loading ? (
            <ActivityIndicator color={isPrimary ? colors.primaryForeground : colors.foreground} />
          ) : (
            <View style={styles.buttonInner}>
              <View style={styles.iconSlot}>{icon}</View>
              <Text
                style={[
                  styles.buttonLabel,
                  { color: isPrimary ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {label}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

/** Horizontal rule with centered "or" between stacked auth method buttons. */
function AuthOrDivider() {
  const { t } = useTranslation();

  return (
    <View style={styles.dividerRow} accessibilityRole="none">
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{t('auth.or')}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

type AuthMethodPickerProps = {
  onSelect: (method: AuthMethod) => void;
  onGooglePress: () => void;
  googleLoading?: boolean;
};

export function AuthMethodPicker({
  onSelect,
  onGooglePress,
  googleLoading = false,
}: AuthMethodPickerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Text style={[styles.sectionLabel, { color: colors.muted }]}>{t('auth.chooseHow')}</Text>

      <AuthMethodButton
        label={t('auth.continuePhone')}
        variant="primary"
        icon={<Smartphone size={20} color="#ffffff" strokeWidth={2} />}
        onPress={() => onSelect('phone')}
        containerStyle={styles.afterLabel}
      />

      <AuthOrDivider />

      <AuthMethodButton
        label={t('auth.continueEmail')}
        icon={<Mail size={20} color={colors.foreground} strokeWidth={2} />}
        onPress={() => onSelect('email')}
        containerStyle={styles.afterDivider}
      />

      <AuthMethodButton
        label={t('auth.continueGoogle')}
        icon={<GoogleMark size={20} />}
        onPress={onGooglePress}
        loading={googleLoading}
        disabled={googleLoading}
      />

      <Text style={[styles.disclaimer, { color: colors.muted }]}>{t('auth.disclaimer')}</Text>
    </View>
  );
}

type AuthMethodSwitchProps = {
  current: AuthMethod;
  onSwitch: (method: AuthMethod) => void;
};

export function AuthMethodSwitch({ current, onSwitch }: AuthMethodSwitchProps) {
  const { t } = useTranslation();
  const other: AuthMethod = current === 'phone' ? 'email' : 'phone';

  return (
    <Pressable onPress={() => onSwitch(other)} className={layout.stack}>
      <Text className={`text-center ${text.link}`}>
        {t('auth.useOtherInstead', { method: t(other === 'phone' ? 'auth.phone' : 'auth.email') })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  afterLabel: {
    marginBottom: spacing[3],
  },
  afterDivider: {
    marginBottom: spacing[2],
  },
  buttonSlot: {
    width: '100%',
  },
  buttonPressable: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonFace: {
    width: '100%',
    minHeight: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    width: 28,
    marginRight: spacing[2],
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing[3],
    marginTop: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  dividerText: {
    paddingHorizontal: spacing[3],
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  disclaimer: {
    marginTop: spacing[4],
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
