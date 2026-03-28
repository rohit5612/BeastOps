import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { loadConfig } from './core/config/index.js';
import { requestLoggingMiddleware } from './core/middlewares/logging.js';
import { notFoundMiddleware } from './core/middlewares/notFound.js';
import { errorHandlerMiddleware } from './core/middlewares/errorHandler.js';
import { createRootRouter } from './routes/index.js';
import { optionalSessionMiddleware } from './auth/session.js';

export function createApp() {
  const app = express();
  const config = loadConfig();

  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    }),
  );
  app.use(morgan('dev'));
  app.use(requestLoggingMiddleware);
  app.use(express.json());
  app.use(cookieParser());
  app.use(optionalSessionMiddleware);

  app.use('/api', createRootRouter());

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}

