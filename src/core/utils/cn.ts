import type { ClassValue } from "clsx";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";



/**
 * @description
 * Joins class names, letting later Tailwind classes override earlier ones.
 *
 * @param inputs - The class names, conditionally
 * @returns The merged class string
 */
export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs));
}
