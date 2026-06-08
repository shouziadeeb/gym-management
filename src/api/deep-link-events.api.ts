import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type DeepLinkEventType =
  | 'qr_scan_join'
  | 'qr_scan_attendance'
  | 'join_conversion'
  | 'join_approved'
  | 'join_rejected'
  | 'attendance_success'
  | 'attendance_failed'
  | 'install_prompt_shown'
  | 'install_conversion';

type RecordDeepLinkEventParams = {
  eventType: DeepLinkEventType;
  gymId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Fire-and-forget analytics for QR / deep-link funnels. */
export async function recordDeepLinkEvent(params: RecordDeepLinkEventParams): Promise<string | null> {
  const { data, error } = await supabase.rpc('record_deep_link_event', {
    p_event_type: params.eventType,
    p_gym_id: params.gymId ?? null,
    p_platform: Platform.OS,
    p_metadata: params.metadata ?? {},
  });

  if (error) {
    return null;
  }

  return typeof data === 'string' ? data : null;
}
