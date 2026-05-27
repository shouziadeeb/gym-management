import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { cardSurface, modalOverlay } from '@/theme/styles';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Show drag handle at top of sheet. */
  showHandle?: boolean;
};

/** Slide-up sheet with safe bottom inset (nav bar / home indicator). */
export function BottomSheet({ visible, onClose, children, showHandle = true }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={modalOverlay(colors)} onPress={onClose}>
        <SafeAreaView edges={['bottom']} style={{ width: '100%' }}>
          <Pressable
            className="rounded-t-3xl px-4 pt-3"
            style={[
              cardSurface(colors, true),
              {
                borderBottomWidth: 0,
                paddingBottom: spacing[5],
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            {showHandle ? (
              <View className="mb-4 items-center">
                <View className="h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
              </View>
            ) : null}
            {children}
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}
