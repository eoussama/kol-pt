import { useEffect, useState } from "react";



/**
 * @description
 * Whether something has been going on for a while, so quick loads can skip
 * their loading state instead of flashing it.
 *
 * @param active - Whether it is going on
 * @param delayMs - How long is a while, in milliseconds
 * @returns True once it has been active for the delay, until it stops
 */
export function useDelayed(active: boolean, delayMs: number): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    setElapsed(false);

    if (!active) {
      return;
    }

    const timer = setTimeout(setElapsed, delayMs, true);

    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return active && elapsed;
}
