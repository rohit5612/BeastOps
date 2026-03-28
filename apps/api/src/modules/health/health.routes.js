import expressPromiseRouter from 'express-promise-router';
import { getHealth, getHealthDb } from './health.controller.js';

export function createHealthRouter() {
  const router = expressPromiseRouter();

  router.get('/', getHealth);
  router.get('/db', getHealthDb);

  return router;
}

