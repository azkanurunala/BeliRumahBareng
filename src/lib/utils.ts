import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize unit measure to ensure proper formatting
 * Converts "m2" to "m²" and ensures consistent format
 */
export function normalizeUnitMeasure(unitMeasure?: string | null): string {
  if (!unitMeasure) return 'm²';
  
  // Convert m2 to m²
  return unitMeasure.replace(/m2/gi, 'm²');
}