import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server.js';

const port = Number(process.env.PORT) || 4000;

async function bootstrap() {
  const app = await createServer();

  app.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port} (all interfaces :${port})`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});

