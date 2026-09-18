import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

/**
 * Local / long-running server entrypoint. On Vercel the app is instead exported
 * as a serverless handler (added in the deployment phase); this file is used
 * for `npm run dev` and `npm start`.
 */
const app = createApp();

app.listen(config.port, () => {
  logger.info('Server started', { port: config.port, env: config.env });
});
