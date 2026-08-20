const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const db = require('./database');
const { apiLimiter } = require('./middleware/rate-limit.middleware');
const ai = require('./services/ai-provider.service');

// Load environment variables
dotenv.config();

const app = express();

// Global Middleware
app.use(helmet()); // Security headers

const configuredOrigin = process.env.CLIENT_URL || 'http://localhost:8080';
const allowedOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://172.29.224.1:8080",
  "http://172.25.245.247:8080"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(morgan('dev')); // Request logging
// 30mb accommodates the Log Analyzer's 25MB log-paste limit; default (100kb)
// would silently reject any log submission larger than that.
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    ai: {
      provider: ai.PROVIDER,
      model: ai.getModelName(),
      configured: ai.isConfigured()
    }
  });
});

// Routes
app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/infra', require('./routes/infra.routes.js'));
app.use('/api/incidents', require('./routes/incidents.routes.js'));
app.use('/api/billing', require('./routes/billing.routes.js'));
app.use('/api/log-analyzer', require('./routes/log-analyzer.routes.js'));
app.use('/api/audit-logs', require('./routes/audit-logs.routes.js'));
app.use('/api/optimization-advisor', require('./routes/optimization-advisor.routes.js'));
app.use('/api/datasets', require('./routes/datasets.routes.js'));
app.use('/api/reports', require('./routes/reports.routes.js'));
app.use('/api/rca', require('./routes/rca.routes.js'));
app.use('/api/calc-history', require('./routes/calc-history.routes.js'));
app.use('/api/infrabot', require('./routes/infrabot.routes.js'));

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Resource not found' });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
