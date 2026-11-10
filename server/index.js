import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import userRoutes from './routes/user/index.js';
import adminRoutes from './routes/admin/index.js';
import { handleWebhookEvent } from './services/payments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS Whitelisting
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, webhooks) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

// 3. API Rate Limiting (100 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// 4. Razorpay Webhook Endpoint (Requires raw body for HMAC signature verification)
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      await handleWebhookEvent(req.body, signature);
      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      console.error('Webhook verification error:', err.message);
      return res.status(400).json({ error: err.message });
    }
  }
);

// 5. Standard JSON Body Parser for all remaining endpoints
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CaptionCraft API Engine',
    timestamp: new Date().toISOString()
  });
});

// 7. Mount Core Route Handlers
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);

// 8. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// 9. Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CaptionCraft Backend running at http://localhost:${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
