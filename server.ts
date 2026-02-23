
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import handlers
import createPaymentHandler from './api/create-payment';
import checkPaymentHandler from './api/check-payment';
import asaasWebhookHandler from './api/webhooks/asaas';
import stoneWebhookHandler from './api/webhooks/stone';
import braipWebhookHandler from './api/webhooks/braip';
import pagbankWebhookHandler from './api/webhooks/pagbank';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON bodies
  app.use(express.json());

  // API Routes
  app.post(['/api/create-payment', '/api/create-payment/'], createPaymentHandler);
  app.post(['/api/check-payment', '/api/check-payment/'], checkPaymentHandler);
  app.post(['/api/webhooks/asaas', '/api/webhooks/asaas/'], asaasWebhookHandler);
  app.post(['/api/webhooks/stone', '/api/webhooks/stone/'], stoneWebhookHandler);
  app.post(['/api/webhooks/braip', '/api/webhooks/braip/'], braipWebhookHandler);
  app.post(['/api/webhooks/pagbank', '/api/webhooks/pagbank/'], pagbankWebhookHandler);

  // Health check
  app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
