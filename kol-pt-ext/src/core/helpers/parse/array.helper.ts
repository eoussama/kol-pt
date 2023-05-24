/**
 * @description
 * Helps with arrays
 */
export class ArrayHelper {

  /**
   * @description
   * Returns the shortest string out of an array
   *
   * @param array The input array
   * @param fallback A fallback value in case nothing was returned
   */
  static getShortest(array: Array<string>, fallback: string = ''): string {
    return array.sort((a: string, b: string) => a.length - b.length)[0] ?? fallback ?? '';
  }
}