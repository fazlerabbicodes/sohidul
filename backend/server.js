const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Database initialization
require('./db');

// API Routes
app.use('/api/overview', require('./routes/overview'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/fraud', require('./routes/fraud'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/messenger', require('./routes/messenger'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/couriers', require('./routes/couriers'));
app.use('/api/facebook-pages', require('./routes/facebookPages'));
app.use('/api/ai-agent', require('./routes/aiAgent'));
app.use('/api/n8n', require('./routes/n8n'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Health & System status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'CommercePilot AI API',
    database: 'SQLite WAL mode connected',
    timestamp: new Date().toISOString(),
    automation: {
      n8n_ready: true,
      webhooks_active: true
    }
  });
});

// Serve frontend build if present
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(frontendDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('CommercePilot AI Backend API is running on port ' + PORT);
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 CommercePilot AI Backend is running on http://localhost:${PORT}`);
  console.log(`📡 Ready for n8n automation and webhooks on http://localhost:${PORT}/api/webhooks`);
});
