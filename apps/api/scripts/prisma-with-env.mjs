/**
 * Loads the same env as the API (including DATABASE_URL from DB_*), then runs Prisma CLI.
 * Usage: node scripts/prisma-with-env.mjs migrate dev
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(apiRoot);

await import(pathToFileURL(join(apiRoot, 'src', 'bootstrap-env.js')).href);

const prismaArgs = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  cwd: apiRoot,
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
