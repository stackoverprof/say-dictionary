/**
 * A dictionary entry mapping language codes to translated text.
 */
export type DictionaryEntry = Record<string, string>;

/**
 * A dictionary mapping translation keys to their language entries.
 */
export type Dictionary = Record<string, DictionaryEntry>;
