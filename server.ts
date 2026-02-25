
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env se existir
dotenv.config();

// Import handlers
import createPaymentHandler from './api/create-payment';
import checkPaymentHandler from './api/check-payment';
import sigilopayWebhookHandler from './api/webhooks/sigilopay';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware for JSON bodies
  app.use(express.json());

  // API Routes
  app.post(['/api/create-payment', '/api/create-payment/'], createPaymentHandler);
  app.post(['/api/check-payment', '/api/check-payment/'], checkPaymentHandler);
  app.post(['/api/webhooks/sigilopay', '/api/webhooks/sigilopay/'], sigilopayWebhookHandler);

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
    // Em produção, o servidor roda de dist-server/, então precisamos subir um nível para achar a pasta dist
    const distPath = path.join(__dirname, '..', 'dist');
    
    app.use(express.static(distPath));
    
    // Fallback para SPA
    app.use((req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables check:');
    console.log('- SIGILOPAY_PUBLIC_KEY:', process.env.SIGILOPAY_PUBLIC_KEY ? 'Configurada' : 'Ausente');
    console.log('- SIGILOPAY_SECRET_KEY:', process.env.SIGILOPAY_SECRET_KEY ? 'Configurada' : 'Ausente');
    console.log('- APP_URL:', process.env.APP_URL ? 'Configurada' : 'Ausente');
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
