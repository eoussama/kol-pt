/**
 * @description
 * Nullable type represents a union type of T, null and undefined.
 * It allows to declare variables that can either be of type T, null or undefined.
 * 
 * @typeparam T The type of the variable that can be null or undefined.
 * 
 * @example
 * type MaybeString = Nullable<string>;
 * const str: MaybeString = null; // ok
 * const str2: MaybeString = undefined; // ok
 * const str3: MaybeString = 'hello world'; // ok
 */
export type Nullable<T> = T | null | undefined;
