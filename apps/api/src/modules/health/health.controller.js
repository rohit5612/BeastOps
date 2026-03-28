import { getDbHealthStatus, getHealthStatus } from './health.service.js';

export async function getHealth(req, res) {
  const payload = getHealthStatus();
  res.json(payload);
}

export async function getHealthDb(req, res) {
  try {
    const payload = await getDbHealthStatus();
    res.json(payload);
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
    });
  }
}

