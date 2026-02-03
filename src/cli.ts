#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

interface DictionaryEntry {
  [lang: string]: string;
}

interface Dictionary {
  [key: string]: DictionaryEntry;
}

function extractKeys(content: string): string[] {
  const keys: string[] = [];
  // Match say("...") or say('...')
  const regex = /\bsay\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

function walkDir(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (
          entry.name !== "node_modules" &&
          !entry.name.startsWith(".") &&
          entry.name !== "dist" &&
          entry.name !== "build"
        ) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

function loadDictionary(filePath: string): Dictionary {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  }
  return {};
}

function saveDictionary(filePath: string, dictionary: Dictionary): void {
  const sorted = Object.keys(dictionary)
    .sort()
    .reduce((acc, key) => {
      acc[key] = dictionary[key];
      return acc;
    }, {} as Dictionary);

  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + "\n");
}

function printUsage(): void {
  console.log(`
say-dictionary CLI - Extract translation keys from source files

Usage:
  say-dictionary extract -l <langs> -i <dir> -o <file>

Options:
  -l, --lang  Comma-separated list of languages (first lang gets key as default)
  -i, --in    Source directory to scan
  -o, --out   Output dictionary file
  -h, --help  Show this help message

Example:
  say-dictionary extract -l en,is -i ./app -o ./dictionary.json
`);
}

function parseArgs(args: string[]): {
  command?: string;
  src?: string;
  out?: string;
  languages?: string[];
  help: boolean;
} {
  const result = {
    command: undefined as string | undefined,
    src: undefined as string | undefined,
    out: undefined as string | undefined,
    languages: undefined as string[] | undefined,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "extract") {
      result.command = "extract";
    } else if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--in" || arg === "-i") {
      result.src = args[++i];
    } else if (arg === "--out" || arg === "-o") {
      result.out = args[++i];
    } else if (arg === "--lang" || arg === "-l") {
      result.languages = args[++i]?.split(",");
    }
  }

  return result;
}

function main(): void {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (parsed.help || !parsed.command) {
    printUsage();
    process.exit(parsed.help ? 0 : 1);
  }

  if (parsed.command === "extract") {
    if (!parsed.languages || !parsed.src || !parsed.out) {
      console.error("Error: -l, -i, and -o are all required");
      printUsage();
      process.exit(1);
    }

    const srcDir = path.resolve(parsed.src);
    const outFile = path.resolve(parsed.out);

    if (!fs.existsSync(srcDir)) {
      console.error(`Error: Source directory does not exist: ${srcDir}`);
      process.exit(1);
    }

    console.log(`Scanning ${srcDir} for say() calls...`);

    const files = walkDir(srcDir, [".ts", ".tsx", ".js", ".jsx"]);
    const allKeys = new Set<string>();

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const keys = extractKeys(content);
      keys.forEach((key) => allKeys.add(key));
    }

    console.log(`Found ${allKeys.size} unique keys in ${files.length} files`);

    const existingDict = loadDictionary(outFile);
    let newKeysCount = 0;

    for (const key of allKeys) {
      if (!existingDict[key]) {
        existingDict[key] = {};
        for (const lang of parsed.languages) {
          existingDict[key][lang] = lang === parsed.languages[0] ? key : "";
        }
        newKeysCount++;
      } else {
        // Ensure all languages are present
        for (const lang of parsed.languages) {
          if (existingDict[key][lang] === undefined) {
            existingDict[key][lang] = "";
          }
        }
      }
    }

    saveDictionary(outFile, existingDict);

    console.log(`Added ${newKeysCount} new keys`);
    console.log(`Dictionary saved to ${outFile}`);
  }
}

main();
