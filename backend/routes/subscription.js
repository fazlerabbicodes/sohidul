const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { dispatchN8nEvent } = require('../services/n8nDispatcher');

// GET subscription status
router.get('/', (req, res) => {
  try {
    const sub = db.prepare('SELECT * FROM subscription WHERE id = 1').get();
    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET payment history
router.get('/payments', (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM payments ORDER BY date DESC').all();
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET notifications
router.get('/notifications', (req, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST renew or upgrade subscription
router.post('/renew', async (req, res) => {
  try {
    const {
      plan = 'Pro Monthly — ৳2,999 · 1 month · 5 Pages',
      method = 'bKash',
      reference,
      promo_code,
      note
    } = req.body;

    if (!reference) {
      return res.status(400).json({ success: false, error: 'Transaction reference is required' });
    }

    const payId = `pay-${Date.now().toString(36)}`;
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const amount = 2999;

    db.prepare(`
      INSERT INTO payments (id, date, plan, amount, method, reference, status, invoice_url)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending Verification', '#')
    `).run(payId, today, 'Pro Plan (1 Month)', amount, method, reference);

    // Add notification
    db.prepare(`
      INSERT INTO notifications (id, type, title, message, created_at)
      VALUES (?, 'info', 'Payment submitted for verification', ?, CURRENT_TIMESTAMP)
    `).run(uuidv4(), `Submitted ${method} ref: ${reference} for ${plan}. Verification usually takes 5-15 mins.`);

    // Dispatch n8n event
    await dispatchN8nEvent('subscription.payment_submitted', {
      payment_id: payId,
      amount,
      method,
      reference,
      promo_code,
      note
    });

    res.json({
      success: true,
      message: 'Payment details submitted! We will verify and extend your plan shortly.',
      payment_id: payId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
