import * as base64 from 'base-64';



/**
 * @description
 * Helps with encyption/decryption
 */
export class Base64Helper {

  /**
   * @description
   * Encrypt an input string
   *
   * @param input The input to encryption
   */
  static encrypt(input: string): string {
    return base64.encode(input);
  }

  /**
   * @description
   * Decrypts and input string
  *
  * @param input The input to decrypt
  */
  static decrypt(input: string): string {
    return base64.decode(input);
  }
}