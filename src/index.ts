import IntlMessageFormat from "intl-messageformat";
import { LOG_PREFIX } from "./constants";
import type { Dictionary } from "./types";

interface GlobalConfig {
  dictionary: Dictionary;
  languages: string[];
}

let globalConfig: GlobalConfig | null = null;
let ssrLangOverride: string | null = null;
const formatterCache = new Map<string, IntlMessageFormat>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function assertInitialized(
  config: GlobalConfig | null
): config is GlobalConfig {
  if (!config) {
    console.warn(`${LOG_PREFIX} Not initialized. Call init() first.`);
    return false;
  }
  return true;
}

function getCurrentLanguage(languages: string[]): string | null {
  // SSR override takes priority
  if (ssrLangOverride && languages.includes(ssrLangOverride)) {
    return ssrLangOverride;
  }

  // Fall back to URL detection
  if (!isBrowser()) {
    return null;
  }

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && languages.includes(firstSegment)) {
    return firstSegment;
  }

  return null;
}

function setLanguageInPath(lang: string, languages: string[]): void {
  if (!isBrowser()) {
    return;
  }

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);

  let newPath: string;

  if (languages.includes(segments[0])) {
    segments[0] = lang;
    newPath = "/" + segments.join("/");
  } else {
    newPath = "/" + lang + pathname;
  }

  window.location.href =
    newPath + window.location.search + window.location.hash;
}

/**
 * Initialize say-dictionary with your dictionary.
 * Call this once in your app's entry point (e.g., root.tsx).
 */
export function init(dictionary: Dictionary): void {
  const firstEntry = Object.values(dictionary)[0];
  const languages = firstEntry ? Object.keys(firstEntry) : [];

  globalConfig = {
    dictionary,
    languages,
  };
}

/**
 * Get the translated text for a key based on the current language.
 * Returns the key itself if no translation found.
 */
export function say(key: string, vars?: Record<string, unknown>): string {
  if (!assertInitialized(globalConfig)) {
    return key;
  }

  const { dictionary, languages } = globalConfig;
  const lang = getCurrentLanguage(languages);

  if (!lang) {
    return key;
  }

  const entry = dictionary[key];
  const message = entry ? entry[lang] || key : key;
  if (!vars) {
    return message;
  }

  try {
    const cacheKey = `${lang}\u0000${message}`;
    let formatter = formatterCache.get(cacheKey);
    if (!formatter) {
      formatter = new IntlMessageFormat(message, lang);
      formatterCache.set(cacheKey, formatter);
    }
    const formatted = formatter.format(vars);
    return typeof formatted === "string" ? formatted : String(formatted);
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `${LOG_PREFIX} Failed to format message for key "${key}": ${messageText}`
    );
    return message;
  }
}

/**
 * Get the current language detected from the URL path.
 * Returns null if no language prefix in URL.
 */
export function getLanguage(): string | null {
  if (!assertInitialized(globalConfig)) {
    return null;
  }

  return getCurrentLanguage(globalConfig.languages);
}

/**
 * Set the language for SSR contexts where window doesn't exist.
 * Optional - only needed for SSR frameworks (Next.js, Remix, etc.)
 */
export function ssrLang(lang: string | null): void {
  ssrLangOverride = lang;
}

/**
 * Navigate to the same page in a different language.
 */
export function setLanguage(lang: string): void {
  if (!assertInitialized(globalConfig)) {
    return;
  }

  const { languages } = globalConfig;

  if (!languages.includes(lang)) {
    console.warn(`${LOG_PREFIX} Invalid language: "${lang}"`);
    return;
  }

  setLanguageInPath(lang, languages);
}

/**
 * @deprecated Use init() and direct imports instead.
 */
export function configure(options: {
  languages: string[];
  defaultLanguage: string;
  dictionary: Dictionary;
}): {
  say: typeof say;
  getLanguage: typeof getLanguage;
  setLanguage: typeof setLanguage;
} {
  init(options.dictionary);
  return { say, getLanguage, setLanguage };
}

export type { Dictionary };
