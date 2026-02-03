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

// Get current language from URL
getLanguage(); // "en" or "is"

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

- `/is/about` → Icelandic
- `/about` → Default language (English)

## CLI

Extract translation keys from your source files:

```bash
npx say-dictionary extract --src ./app --out ./dictionary.json --languages en,is
```

Options:

- `--src, -s` - Source directory to scan (required)
- `--out, -o` - Output dictionary file (required)
- `--languages, -l` - Comma-separated list of languages (default: en,is)

Example output in `dictionary.json`:

```json
{
  "Order Now": { "en": "Order Now", "is": "" },
  "Welcome": { "en": "Welcome", "is": "" }
}
```

The first language gets the key as default value. Hand this to an LLM to fill in the translations.

## License

MIT
