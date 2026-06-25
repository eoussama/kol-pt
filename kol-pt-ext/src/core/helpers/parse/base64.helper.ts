import * as base64 from "base-64";
import * as utf8 from "utf8";



/**
 * @description
 * Helps with encyption/decryption
 */
export class Base64Helper {
  /**
   * @description
   * Encrypt an input string
   *
   * @param input - The input to encrypt
   * @returns The base64-encoded string
   */
  static encrypt(input: string): string {
    const bytes = utf8.encode(input);

    return base64.encode(bytes);
  }

  /**
   * @description
   * Decrypts an input string
   *
   * @param input - The input to decrypt
   * @returns The decoded string
   */
  static decrypt(input: string): string {
    return base64.decode(input);
  }
}
