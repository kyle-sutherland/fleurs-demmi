import { z } from "zod";

/** Escape user-supplied strings before interpolating into HTML email bodies. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export const emailSchema = z.string().email().max(254).trim();
export const nameSchema = z.string().min(1).max(200).trim();
export const phoneSchema = z.string().min(1).max(30).trim();
export const textSchema = z.string().max(2000).trim();
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

// Montréal proper postal codes all start with H. Require the address to contain one.
const MONTREAL_POSTAL_CODE = /\bH[0-9][A-Z]\s?[0-9][A-Z][0-9]\b/i;
export const montrealAddressSchema = z
  .string()
  .min(1)
  .max(500)
  .trim()
  .refine((v) => MONTREAL_POSTAL_CODE.test(v), {
    message:
      "Address must include a Montréal postal code (e.g. H2W 1Y5). We only deliver within Montréal.",
  });

export function isMontrealAddress(v: string): boolean {
  return MONTREAL_POSTAL_CODE.test(v);
}
