export const LOG_PREFIX = "[say-dictionary]";

export const EXCLUDED_DIRECTORIES = [
  "node_modules",
  "dist",
  "build",
  ".git",
] as const;

export const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const;

export const SAY_CALL_PATTERN = /\bsay\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
