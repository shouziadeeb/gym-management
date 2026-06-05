/**
 * Server-side push dispatch lives in `supabase/functions/send-push`.
 * Invoke via cron secret or Supabase scheduled trigger — not from the client.
 */
export type SendPushPayload = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export const SEND_PUSH_FUNCTION = 'send-push';
