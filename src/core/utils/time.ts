/**
 * @description
 * Formats a number of seconds as a timestamp, `h:mm:ss`.
 *
 * @param seconds - The number of seconds, fractions are dropped
 * @returns The timestamp
 */
export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

/**
 * @description
 * Formats a number of seconds as a readable duration,
 * e.g. `1 hour 2 minutes 5 seconds`.
 *
 * @param seconds - The number of seconds, fractions are dropped
 * @returns The duration
 */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const parts: Array<[number, string]> = [
    [Math.floor(total / 3600), "hour"],
    [Math.floor((total % 3600) / 60), "minute"],
    [total % 60, "second"],
  ];

  const text = parts
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value} ${unit}${value > 1 ? "s" : ""}`)
    .join(" ");

  return text || "0 seconds";
}
