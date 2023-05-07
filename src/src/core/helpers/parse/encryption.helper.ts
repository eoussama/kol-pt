/**
 * @description
 * Helps with encyption/decryption
 */
export class EncryptionHelper {

  /**
   * @description
   * Encrypt an input string
   *
   * @param input The input to encryption
   */
  static encrypt(input: string): string {
    return window.btoa(input);
  }

  /**
   * @description
   * Decrypts and input string
  *
  * @param input The input to decrypt
  */
  static decrypt(input: string): string {
    return window.atob(input);
  }
}