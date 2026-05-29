/**
 * @file OtpInput.tsx
 * Six-digit OTP entry UI: hidden TextInput + visible boxes with equal widths from onLayout.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { OTP_DIGIT_COUNT } from '@/services/auth/auth.constants';
import { isWeb } from '@/lib/web-layout';
import { inputSurface, textColor } from '@/theme/styles';

const BOX_COUNT = OTP_DIGIT_COUNT;
const BOX_GAP = 10;
const BOX_HEIGHT = 52;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
};

/** Renders six OTP boxes; taps focus a hidden number-pad input for paste and autofill. */
export function OtpInput({ value, onChange, autoFocus = true, disabled = false }: OtpInputProps) {
  const { colors } = useTheme();
  const hiddenRef = useRef<TextInput>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const normalizedValue = value.replace(/\D/g, '').slice(0, BOX_COUNT);
  const digits = Array.from({ length: BOX_COUNT }, (_, index) => normalizedValue[index] ?? '');

  // Equal box widths: subtract fixed gaps from measured row width (avoids flex gap bugs on web).
  const totalGap = BOX_GAP * (BOX_COUNT - 1);
  const boxWidth = rowWidth > 0 ? Math.floor((rowWidth - totalGap) / BOX_COUNT) : 0;

  // Keep parent state digits-only and capped at six characters.
  useEffect(() => {
    if (normalizedValue !== value) {
      onChange(normalizedValue);
    }
  }, [normalizedValue, onChange, value]);

  // Delayed focus so the screen layout finishes before the keyboard opens.
  useEffect(() => {
    if (autoFocus && !disabled) {
      const t = setTimeout(() => hiddenRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [autoFocus, disabled]);

  const handleChange = (raw: string) => {
    onChange(raw.replace(/\D/g, '').slice(0, BOX_COUNT));
  };

  const focusInput = () => hiddenRef.current?.focus();

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0 && width !== rowWidth) {
          setRowWidth(width);
        }
      }}
    >
      <TextInput
        ref={hiddenRef}
        value={normalizedValue}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={BOX_COUNT}
        editable={!disabled}
        style={styles.hiddenInput}
        accessibilityLabel="Verification code input"
      />
      <View style={styles.row}>
        {digits.map((digit, index) => {
          const isActive = index === normalizedValue.length && normalizedValue.length < BOX_COUNT;
          const isLast = index === BOX_COUNT - 1;
          return (
            <Pressable
              key={`otp-box-${index}`}
              onPress={focusInput}
              disabled={disabled}
              style={[
                styles.box,
                inputSurface(colors),
                boxWidth > 0 ? { width: boxWidth, marginRight: isLast ? 0 : BOX_GAP } : styles.boxFallback,
                !isLast && boxWidth === 0 ? styles.boxSpacingFallback : null,
                {
                  height: BOX_HEIGHT,
                  borderWidth: isActive ? 2 : 1,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${index + 1}`}
            >
              <Text
                style={[styles.digit, { color: textColor(colors, 'foreground') }]}
                numberOfLines={1}
              >
                {digit || ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignSelf: 'stretch',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    ...(isWeb ? ({ minWidth: 0 } as const) : null),
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  boxFallback: {
    flex: 1,
    minWidth: 0,
  },
  boxSpacingFallback: {
    marginRight: BOX_GAP,
  },
  digit: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    ...(isWeb ? ({ userSelect: 'none' } as const) : null),
  },
});
