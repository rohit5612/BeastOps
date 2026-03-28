import { AppError } from '../utils/errors.js';

// Central error-handling middleware. Assumes async handlers use express-promise-router.
// eslint-disable-next-line no-unused-vars
export function errorHandlerMiddleware(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  const isApp = err instanceof AppError || err.name === 'AppError';
  const status = isApp ? err.status : err.status || 500;
  const code = isApp ? err.code : err.code || 'InternalServerError';
  const message =
    status === 500 ? 'Something went wrong' : err.message || 'Request failed';

  res.status(status).json({
    error: code,
    message,
  });
}

