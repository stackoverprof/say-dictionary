# say-dictionary

URL-based i18n with configurable languages and a CLI for extracting translation keys.

## Installation

```bash
npm install say-dictionary
# or
pnpm add say-dictionary
```

## Usage

### Configure

```ts
import { configure } from 'say-dictionary';

const { say, getLanguage, setLanguage } = configure({
  languages: ['en', 'is'],
  defaultLanguage: 'en',
  dictionary: {
    "Order Now": { en: "Order Now", is: "Panta núna" },
    "Welcome": { en: "Welcome", is: "Velkomin" }
  }
});
```

### say(key)

Get the translated text for the current language (detected from URL path).

```ts
say("Order Now"); // Returns "Order Now" or "Panta núna" based on URL
```

### getLanguage()

Returns the current language detected from the URL path.

```ts
// URL: /is/products
getLanguage(); // Returns "is"

// URL: /products
getLanguage(); // Returns "en" (default)
```

### setLanguage(lang)

Navigate to the same page in a different language.

```ts
// Current URL: /products
setLanguage('is');
// Navigates to: /is/products
```

## URL Structure

The language is detected from the first path segment:

- `/en/about` → English
- `/is/about` → Icelandic
- `/about` → Default language (English)

## CLI

Extract translation keys from your source files:

```bash
npx say-dictionary extract --src ./app --out ./dictionary.json
```

Options:

- `--src, -s` - Source directory to scan (required)
- `--out, -o` - Output dictionary file (required)
- `--languages, -l` - Comma-separated list of languages (default: en,is)

### Example

```bash
npx say-dictionary extract --src ./app --out ./dictionary.json --languages en,is,de
```

This scans your source files for `say("...")` calls and updates `dictionary.json` with any missing keys.

## Type Safety

The package includes full TypeScript support with proper type inference:

```ts
const { say, getLanguage, setLanguage } = configure({
  languages: ['en', 'is'] as const,
  defaultLanguage: 'en',
  dictionary: {}
});

// setLanguage only accepts 'en' | 'is'
setLanguage('fr'); // TypeScript error
```

## License

MIT
