import { useCallback, useState } from 'react';

export const useHitFlash = (durationMs = 180) => {
  const [active, setActive] = useState(false);

  const trigger = useCallback(() => {
    setActive(true);
    setTimeout(() => setActive(false), durationMs);
  }, [durationMs]);

  return { active, trigger };
};
