import type en from "@/translations/en.json";

/**
 * Recursively flattens a nested message object into the dot-notation keys
 * that `t()` accepts, e.g. `"install.steps.init"`.
 */
type FlattenKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : FlattenKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Union of every translation key in `en.json` (the source-of-truth locale). */
export type TranslationKey = FlattenKeys<typeof en>;
