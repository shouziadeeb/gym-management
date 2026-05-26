import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { coordinatesFromAddressQuery, pickDeviceCoordinates, type PickedCoordinates } from '@/lib/locationPick';

import { Button } from '@/components/ui/Button';

import { getErrorMessage } from '@/lib/errors';
import { layout, text } from '@/theme/classes';
import { textColor } from '@/theme/styles';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  label: string;
  description?: string;
  /** Show “Match address fields” helper when supplied. */
  buildAddressGeocodeQuery?: () => string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationLabel?: string | null;
  onCoordinatesChange: (next: Pick<PickedCoordinates, 'latitude' | 'longitude'> & { label?: string }) => void;
  onClear?: () => void;
  disabled?: boolean;
  errorMessage?: string;
};

export function LocationPickerField({
  label,
  description,
  buildAddressGeocodeQuery,
  latitude,
  longitude,
  locationLabel,
  onCoordinatesChange,
  onClear,
  disabled = false,
  errorMessage,
}: Props) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState<'gps' | 'geo' | null>(null);

  const hasPin = typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude);

  const pickFromGps = useCallback(async () => {
    try {
      setBusy('gps');
      const coords = await pickDeviceCoordinates();
      onCoordinatesChange({ latitude: coords.latitude, longitude: coords.longitude, label: coords.label });
    } catch (error) {
      Alert.alert('Location', getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  }, [onCoordinatesChange]);

  const pickFromAddress = useCallback(async () => {
    if (!buildAddressGeocodeQuery) return;
    const raw = buildAddressGeocodeQuery();
    if (!raw || raw.trim().length < 6) {
      Alert.alert('Location', 'Finish address fields before looking them up.');
      return;
    }

    try {
      setBusy('geo');
      const next = await coordinatesFromAddressQuery(raw);
      if (!next) {
        Alert.alert(
          'Location',
          'We could not find coordinates for this address yet. Adjust the text or use GPS instead.',
        );
        return;
      }

      onCoordinatesChange({ latitude: next.latitude, longitude: next.longitude, label: next.label ?? raw });
    } catch (error) {
      Alert.alert('Location', getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  }, [buildAddressGeocodeQuery, onCoordinatesChange]);

  return (
    <View className={layout.cardSpacing}>
      <Text className={text.label} style={{ color: textColor(colors, 'muted') }}>
        {label}
      </Text>
      {description ? <Text className={`${layout.stackSm} ${text.caption}`}>{description}</Text> : null}

      <View className={`${layout.stackMd}`}>
        <View className={`${layout.stackSm}`}>
          <Button title="Use device location (GPS)" variant="ghost" onPress={() => void pickFromGps()} disabled={disabled || busy !== null} />
        </View>
        {buildAddressGeocodeQuery ? (
          <View className={`${layout.stackSm}`}>
            <Button
              title="Match address fields"
              variant="ghost"
              onPress={() => void pickFromAddress()}
              disabled={disabled || busy !== null}
            />
          </View>
        ) : null}
      </View>

      {busy ? <Text className={`${layout.stackSm} ${text.loading}`}>{busy === 'gps' ? 'Reading GPS fix…' : 'Matching address…'}</Text> : null}

      {hasPin ? (
        <View className={layout.stack}>
          <Text className={`${layout.stackSm} ${text.bodySm}`}>{locationLabel?.trim() || 'Selected coordinates'}</Text>
          <Text className={`${text.caption}`} style={{ color: textColor(colors, 'secondary') }}>
            {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
          </Text>
          {onClear ? (
            <View className={layout.stackSm}>
              <Button title="Clear location" variant="ghost" onPress={onClear} disabled={disabled} />
            </View>
          ) : null}
        </View>
      ) : (
        <Text className={`${layout.stackMd} ${text.caption}`}>No location pinned yet.</Text>
      )}

      {errorMessage ? <Text className={`${layout.stackSm} ${text.error}`}>{errorMessage}</Text> : null}
    </View>
  );
}
