import { en } from "./translations/en";
import { fr } from "./translations/fr";
import type { Dictionary } from "./translations/en";

const dictionaries: Record<string, Dictionary> = { en, fr };

export function getDictionary(locale: string): Dictionary {
  return dictionaries[locale] ?? en;
}

export type { Dictionary };
