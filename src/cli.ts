#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import {
  EXCLUDED_DIRECTORIES,
  SAY_CALL_PATTERN,
  SOURCE_EXTENSIONS,
} from "./constants";
import type { Dictionary } from "./types";

function extractKeys(content: string): string[] {
  const keys: string[] = [];
  const regex = new RegExp(SAY_CALL_PATTERN.source, SAY_CALL_PATTERN.flags);
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

function isExcludedDirectory(name: string): boolean {
  return (
    EXCLUDED_DIRECTORIES.includes(
      name as (typeof EXCLUDED_DIRECTORIES)[number]
    ) || name.startsWith(".")
  );
}

function walkDir(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!isExcludedDirectory(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (
          SOURCE_EXTENSIONS.includes(ext as (typeof SOURCE_EXTENSIONS)[number])
        ) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

function loadDictionary(filePath: string): Dictionary {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error reading dictionary file: ${message}`);
    process.exit(1);
  }
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

interface ParsedArgs {
  command?: string;
  src?: string;
  out?: string;
  languages?: string[];
  help: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: undefined,
    src: undefined,
    out: undefined,
    languages: undefined,
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

function runExtract(parsed: ParsedArgs): void {
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

  const files = walkDir(srcDir);
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

function main(): void {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (parsed.help || !parsed.command) {
    printUsage();
    process.exit(parsed.help ? 0 : 1);
  }

  if (parsed.command === "extract") {
    runExtract(parsed);
  }
}

main();
