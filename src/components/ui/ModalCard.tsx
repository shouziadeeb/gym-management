import type { ReactNode } from 'react';
import { Modal, Pressable, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { cardSurface, modalOverlay } from '@/theme/styles';
import { spacing } from '@/theme/spacing';

type Anchor = 'center' | 'bottom' | 'top';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  anchor?: Anchor;
  /** Max width for centered / bottom cards on tablet and web. */
  maxWidth?: number;
};

function justifyForAnchor(anchor: Anchor): ViewStyle['justifyContent'] {
  if (anchor === 'bottom') return 'flex-end';
  if (anchor === 'top') return 'flex-start';
  return 'center';
}

/** Dialog card respecting system safe areas on all edges. */
export function ModalCard({
  visible,
  onClose,
  children,
  anchor = 'center',
  maxWidth = 420,
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <Pressable
          className="flex-1 px-4"
          style={[
            modalOverlay(colors),
            {
              justifyContent: justifyForAnchor(anchor),
              paddingVertical: anchor === 'center' ? spacing[4] : spacing[2],
            },
          ]}
          onPress={onClose}
        >
          <Pressable
            className="w-full rounded-3xl p-5"
            style={[
              cardSurface(colors, true),
              { maxWidth, alignSelf: 'center' },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            {children}
          </Pressable>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}
