const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
};

export async function sendExpoPushBatch(messages: ExpoPushMessage[]): Promise<void> {
  if (!messages.length) return;

  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('Expo push failed', response.status, text);
      continue;
    }

    try {
      const payload = JSON.parse(text) as { data?: Array<{ status?: string; message?: string }> };
      for (const ticket of payload.data ?? []) {
        if (ticket.status === 'error') {
          console.error('Expo push ticket error', ticket.message ?? ticket);
        }
      }
    } catch {
      // Non-JSON response — already logged on HTTP errors.
    }
  }
}
