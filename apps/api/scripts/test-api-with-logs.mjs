/**
 * Verbose wrapper around verify-api.mjs.
 * Adds start/end markers and preserves full console output.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');

function now() {
  return new Date().toISOString();
}

console.log(`[${now()}] Starting backend API verification...`);

const child = spawn(process.execPath, [join(__dirname, 'verify-api.mjs')], {
  cwd: apiRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log(`[${now()}] API verification completed successfully.`);
    process.exit(0);
    return;
  }
  console.log(`[${now()}] API verification failed with exit code ${code}.`);
  process.exit(code ?? 1);
});

