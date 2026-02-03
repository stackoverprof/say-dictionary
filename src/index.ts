type Dictionary = Record<string, Record<string, string>>;

interface GlobalConfig {
  dictionary: Dictionary;
  languages: string[];
}

let globalConfig: GlobalConfig | null = null;

function getLanguageFromPath(languages: string[]): string | null {
  if (typeof window === "undefined") {
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
  if (typeof window === "undefined") {
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

  window.location.href = newPath + window.location.search + window.location.hash;
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
export function say(key: string): string {
  if (!globalConfig) {
    console.warn("[say-dictionary] Not initialized. Call init() first.");
    return key;
  }

  const { dictionary, languages } = globalConfig;
  const lang = getLanguageFromPath(languages);

  if (!lang) {
    return key;
  }

  const entry = dictionary[key];
  if (!entry) {
    return key;
  }

  return entry[lang] || key;
}

/**
 * Get the current language detected from the URL path.
 * Returns null if no language prefix in URL.
 */
export function getLanguage(): string | null {
  if (!globalConfig) {
    console.warn("[say-dictionary] Not initialized. Call init() first.");
    return null;
  }

  return getLanguageFromPath(globalConfig.languages);
}

/**
 * Navigate to the same page in a different language.
 */
export function setLanguage(lang: string): void {
  if (!globalConfig) {
    console.warn("[say-dictionary] Not initialized. Call init() first.");
    return;
  }

  const { languages } = globalConfig;

  if (!languages.includes(lang)) {
    console.warn(`[say-dictionary] Invalid language: "${lang}"`);
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
}): { say: typeof say; getLanguage: typeof getLanguage; setLanguage: typeof setLanguage } {
  init(options.dictionary);
  return { say, getLanguage, setLanguage };
}

export type { Dictionary };
