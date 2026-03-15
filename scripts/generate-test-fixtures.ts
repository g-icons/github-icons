/**
 * Generates a /test folder with every mapped folder name and file extension
 * from the default Material Icon Theme manifest, so you can visually verify
 * all icons render correctly when the extension is active on GitHub/GitLab.
 *
 * Usage: npx tsx scripts/generate-test-fixtures.ts
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TEST_DIR = path.join(ROOT, 'test');
const MANIFEST_PATH = path.join(ROOT, 'public/manifests/default.json');

interface Manifest {
  fileExtensions?: Record<string, string>;
  fileNames?: Record<string, string>;
  folderNames?: Record<string, string>;
  folderNamesExpanded?: Record<string, string>;
  rootFolderNames?: Record<string, string>;
  rootFolderNamesExpanded?: Record<string, string>;
  light?: Manifest;
}

// Characters that are invalid or problematic in filenames across platforms
const INVALID_CHARS = /[<>:"|?*\x00-\x1f]/;
const RESERVED_NAMES = new Set([
  'con', 'prn', 'aux', 'nul',
  'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);

function isSafeFilename(name: string): boolean {
  if (!name || name.length > 200) return false;
  if (INVALID_CHARS.test(name)) return false;
  const base = name.replace(/\..+$/, '').toLowerCase();
  if (RESERVED_NAMES.has(base)) return false;
  return true;
}

function main() {
  const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));

  // Clean previous test dir
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }

  // --- Folders ---
  const folderNames = new Set<string>();
  for (const name of Object.keys(manifest.folderNames ?? {})) folderNames.add(name);
  for (const name of Object.keys(manifest.folderNamesExpanded ?? {})) folderNames.add(name);
  for (const name of Object.keys(manifest.rootFolderNames ?? {})) folderNames.add(name);
  for (const name of Object.keys(manifest.rootFolderNamesExpanded ?? {})) folderNames.add(name);
  if (manifest.light) {
    for (const name of Object.keys(manifest.light.folderNames ?? {})) folderNames.add(name);
    for (const name of Object.keys(manifest.light.folderNamesExpanded ?? {})) folderNames.add(name);
    for (const name of Object.keys(manifest.light.rootFolderNames ?? {})) folderNames.add(name);
    for (const name of Object.keys(manifest.light.rootFolderNamesExpanded ?? {})) folderNames.add(name);
  }

  const foldersDir = path.join(TEST_DIR, 'folders');
  mkdirSync(foldersDir, { recursive: true });

  const sortedFolders = [...folderNames].sort();
  let folderCount = 0;
  for (const name of sortedFolders) {
    if (!isSafeFilename(name)) continue;
    const folderPath = path.join(foldersDir, name);
    mkdirSync(folderPath, { recursive: true });
    // Put a .gitkeep so empty folders are tracked by git
    writeFileSync(path.join(folderPath, '.gitkeep'), '');
    folderCount++;
  }

  // --- File names (exact match files like .gitignore, Dockerfile, etc.) ---
  const fileNames = new Set<string>();
  for (const name of Object.keys(manifest.fileNames ?? {})) fileNames.add(name);
  if (manifest.light) {
    for (const name of Object.keys(manifest.light.fileNames ?? {})) fileNames.add(name);
  }

  const fileNamesDir = path.join(TEST_DIR, 'filenames');
  mkdirSync(fileNamesDir, { recursive: true });

  const sortedFileNames = [...fileNames].sort();
  let fileNameCount = 0;
  for (const name of sortedFileNames) {
    if (!isSafeFilename(name)) continue;
    // Some filenames contain path separators (e.g., ".github/dependabot.yml")
    if (name.includes('/') || name.includes('\\')) continue;
    const filePath = path.join(fileNamesDir, name);
    writeFileSync(filePath, '');
    fileNameCount++;
  }

  // --- File extensions ---
  const fileExtensions = new Set<string>();
  for (const ext of Object.keys(manifest.fileExtensions ?? {})) fileExtensions.add(ext);
  if (manifest.light) {
    for (const ext of Object.keys(manifest.light.fileExtensions ?? {})) fileExtensions.add(ext);
  }

  const extensionsDir = path.join(TEST_DIR, 'extensions');
  mkdirSync(extensionsDir, { recursive: true });

  const sortedExtensions = [...fileExtensions].sort();
  let extensionCount = 0;
  for (const ext of sortedExtensions) {
    if (!ext) continue;
    // Some "extensions" are compound (e.g., "spec.ts", "test.js")
    // Create as "file.<ext>"
    const filename = `file.${ext}`;
    if (!isSafeFilename(filename)) continue;
    const filePath = path.join(extensionsDir, filename);
    writeFileSync(filePath, '');
    extensionCount++;
  }

  console.log(`Generated test fixtures in ${TEST_DIR}:`);
  console.log(`  Folders:         ${folderCount}`);
  console.log(`  File names:      ${fileNameCount}`);
  console.log(`  File extensions: ${extensionCount}`);
  console.log(`  Total:           ${folderCount + fileNameCount + extensionCount}`);
}

main();
