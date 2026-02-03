type Dictionary = Record<string, Record<string, string>>;

interface InitOptions {
  dictionary: Dictionary;
  defaultLanguage?: string;
}

interface GlobalConfig {
  dictionary: Dictionary;
  languages: string[];
  defaultLanguage: string;
}

// Global state
let globalConfig: GlobalConfig | null = null;

function getLanguageFromPath(
  languages: string[],
  defaultLanguage: string
): string {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && languages.includes(firstSegment)) {
    return firstSegment;
  }

  return defaultLanguage;
}

function setLanguageInPath(
  lang: string,
  languages: string[],
  defaultLanguage: string
): void {
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

  if (lang === defaultLanguage) {
    const newSegments = newPath.split("/").filter(Boolean);
    if (newSegments[0] === defaultLanguage) {
      newSegments.shift();
      newPath = "/" + newSegments.join("/") || "/";
    }
  }

  window.location.href = newPath + window.location.search + window.location.hash;
}

/**
 * Initialize say-dictionary with your dictionary and default language.
 * Call this once in your app's entry point (e.g., root.tsx).
 */
export function init(options: InitOptions): void {
  const firstEntry = Object.values(options.dictionary)[0];
  const languages = firstEntry ? Object.keys(firstEntry) : [];

  globalConfig = {
    dictionary: options.dictionary,
    languages,
    defaultLanguage: options.defaultLanguage || languages[0] || "en",
  };
}

/**
 * Get the translated text for a key based on the current language.
 */
export function say(key: string): string {
  if (!globalConfig) {
    console.warn("[say-dictionary] Not initialized. Call init() first.");
    return key;
  }

  const { dictionary, languages, defaultLanguage } = globalConfig;
  const lang = getLanguageFromPath(languages, defaultLanguage);
  const entry = dictionary[key];

  if (!entry) {
    console.warn(`[say-dictionary] Missing key: "${key}"`);
    return key;
  }

  const translation = entry[lang];

  if (!translation) {
    console.warn(
      `[say-dictionary] Missing translation for key "${key}" in language "${lang}"`
    );
    return entry[defaultLanguage] || key;
  }

  return translation;
}

/**
 * Get the current language detected from the URL path.
 */
export function getLanguage(): string {
  if (!globalConfig) {
    console.warn("[say-dictionary] Not initialized. Call init() first.");
    return "en";
  }

  return getLanguageFromPath(globalConfig.languages, globalConfig.defaultLanguage);
}

/**
 * Navigate to the same page in a different language.
 */
export function setLanguage(lang: string): void {
  if (!globalConfig) {
    console.warn("[say-dictionary] Not initialized. Call init() first.");
    return;
  }

  const { languages, defaultLanguage } = globalConfig;

  if (!languages.includes(lang)) {
    console.warn(`[say-dictionary] Invalid language: "${lang}"`);
    return;
  }

  setLanguageInPath(lang, languages, defaultLanguage);
}

/**
 * @deprecated Use init() and direct imports instead.
 * Kept for backwards compatibility.
 */
export function configure(options: {
  languages: string[];
  defaultLanguage: string;
  dictionary: Dictionary;
}): { say: typeof say; getLanguage: typeof getLanguage; setLanguage: typeof setLanguage } {
  init({
    dictionary: options.dictionary,
    defaultLanguage: options.defaultLanguage,
  });
  return { say, getLanguage, setLanguage };
}

export type { Dictionary, InitOptions };
