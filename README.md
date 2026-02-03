# say-dictionary

URL-based i18n with configurable languages and a CLI for extracting translation keys.

## Why?

The dictionary format is designed to be **LLM-friendly**. Just hand your `dictionary.json` to an AI and ask it to translate — done. No complex tooling, no translation service integrations, no manual key mapping.

## Installation

```bash
npm install say-dictionary
# or
pnpm add say-dictionary
```

## Usage

### 1. Initialize (once in your entry point)

```ts
// root.tsx or app entry
import { init } from 'say-dictionary';
import dictionary from './dictionary.json';

init(dictionary);
```

### 2. Use anywhere

```ts
import { say, getLanguage, setLanguage } from 'say-dictionary';

// Get translated text
say("Order Now"); // Returns "Order Now" or "Panta núna" based on URL

// Get current language from URL (null if no language prefix)
getLanguage(); // "is" or null

// Navigate to different language
setLanguage('is'); // Redirects to /is/current-path
```

## Dictionary Format

```json
{
  "Order Now": { "en": "Order Now", "is": "Panta núna" },
  "Welcome": { "en": "Welcome", "is": "Velkomin" }
}
```

Languages are automatically detected from the dictionary keys.

## URL Structure

The language is detected from the first path segment:

- `/is/about` → Icelandic (`say()` returns translation)
- `/about` → No language prefix (`say()` returns the key itself)

## SSR (Next.js, Remix, etc.)

For SSR frameworks, use `ssrLang()` to prevent hydration mismatch:

```tsx
// app/[lang]/page.tsx
export default async function Page({ params }) {
  const { lang } = await params;
  return <Home lang={lang} />;
}

// app/page.tsx
"use client";
import { ssrLang, say } from 'say-dictionary';

export default function Home({ lang }: { lang?: string }) {
  ssrLang(lang ?? null);
  return <h1>{say("Hello")}</h1>;
}
```

This is optional — only needed for SSR. Client-side apps (Vite, CRA) work without it.

## CLI

Extract translation keys from your source files:

```bash
npx say-dictionary extract -l en,is -i ./app -o ./dictionary.json
```

Options:

- `-l, --lang` - Comma-separated list of languages
- `-i, --in` - Source directory to scan
- `-o, --out` - Output dictionary file

Output `dictionary.json`:

```json
{
  "Order Now": { "en": "Order Now", "is": "" },
  "Welcome": { "en": "Welcome", "is": "" }
}
```

**The first language (`en`) gets the key as its value.** Hand this to an LLM to fill in the translations.

## License

MIT
