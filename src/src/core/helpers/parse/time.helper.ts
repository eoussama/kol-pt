export class TimeHelper {

  /**
   * @description
   * Converts a number of seconds to a string in the format "h:m:s".
   *
   * @param seconds The number of seconds to convert.
   *
   * @returns A string representing the time in the format "h:m:s".
   */
  static parse(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const hourStr = hours.toString();
    const minuteStr = minutes.toString().padStart(2, "0");
    const secondStr = remainingSeconds.toString().padStart(2, "0");

    return `${hourStr}:${minuteStr}:${secondStr}`;
  }

  /**
   * @description
   * Convert seconds to a string with format 'h hour(s) m minute(s) s second(s)'
   *
   * @param seconds The number of seconds to convert
   *
   * @returns The time string in the format 'h hour(s) m minute(s) s second(s)'
 */
  static format(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let timeString = '';

    if (hours > 0) {
      timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
    }

    if (minutes > 0) {
      timeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    }

    if (remainingSeconds > 0 || timeString === '') {
      timeString += `${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
    }

    return timeString.trim();
  }

  /**
   * @description
   * Checks if timestamp has ellapsed
   */
  static ellapsed(timestamp: number, time: number): boolean {
    return timestamp + time < Date.now()
  }
}