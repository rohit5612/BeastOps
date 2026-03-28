import './bootstrap-env.js';
import { createApp } from './app.js';
import { loadConfig } from './core/config/index.js';
import { ensureSystemSuperusers } from './core/systemUsers/ensure.js';

async function start() {
  await ensureSystemSuperusers();
  const { port } = loadConfig();
  const app = createApp();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API server', err);
  process.exit(1);
});

