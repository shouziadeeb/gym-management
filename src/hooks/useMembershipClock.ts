import { useEffect, useState } from 'react';

export function useMembershipClock(tickMs = 60_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(timer);
  }, [tickMs]);

  return now;
}
