type Dictionary<TLanguages extends string> = Record<
  string,
  Record<TLanguages, string>
>;

interface ConfigOptions<TLanguages extends string> {
  languages: TLanguages[];
  defaultLanguage: TLanguages;
  dictionary: Dictionary<TLanguages>;
}

interface SayDictionary<TLanguages extends string> {
  say: (key: string) => string;
  getLanguage: () => TLanguages;
  setLanguage: (lang: TLanguages) => void;
}

function getLanguageFromPath<TLanguages extends string>(
  languages: TLanguages[],
  defaultLanguage: TLanguages
): TLanguages {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && languages.includes(firstSegment as TLanguages)) {
    return firstSegment as TLanguages;
  }

  return defaultLanguage;
}

function setLanguageInPath<TLanguages extends string>(
  lang: TLanguages,
  languages: TLanguages[],
  defaultLanguage: TLanguages
): void {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const currentLang = getLanguageFromPath(languages, defaultLanguage);

  let newPath: string;

  if (languages.includes(segments[0] as TLanguages)) {
    // Replace existing language prefix
    segments[0] = lang;
    newPath = "/" + segments.join("/");
  } else {
    // Add language prefix
    newPath = "/" + lang + pathname;
  }

  // Remove default language from path if it's the default
  if (lang === defaultLanguage) {
    const newSegments = newPath.split("/").filter(Boolean);
    if (newSegments[0] === defaultLanguage) {
      newSegments.shift();
      newPath = "/" + newSegments.join("/") || "/";
    }
  }

  window.location.href = newPath + window.location.search + window.location.hash;
}

export function configure<TLanguages extends string>(
  options: ConfigOptions<TLanguages>
): SayDictionary<TLanguages> {
  const { languages, defaultLanguage, dictionary } = options;

  function say(key: string): string {
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

  function getLanguage(): TLanguages {
    return getLanguageFromPath(languages, defaultLanguage);
  }

  function setLanguage(lang: TLanguages): void {
    if (!languages.includes(lang)) {
      console.warn(`[say-dictionary] Invalid language: "${lang}"`);
      return;
    }
    setLanguageInPath(lang, languages, defaultLanguage);
  }

  return { say, getLanguage, setLanguage };
}

export type { Dictionary, ConfigOptions, SayDictionary };
