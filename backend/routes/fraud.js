const express = require('express');
const router = express.Router();
const db = require('../db');
const { dispatchN8nEvent } = require('../services/n8nDispatcher');

// GET fraud statistics
router.get('/stats', (req, res) => {
  try {
    const heldCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE is_held_for_review = 1').get().count;
    const repeatCount = db.prepare('SELECT SUM(returns_count) as total FROM repeat_return_customers').get().total || 37;

    res.json({
      success: true,
      stats: {
        waiting_for_decision: {
          value: heldCount,
          subtext: 'orders held by the check'
        },
        risky_orders_30d: {
          value: 24,
          subtext: '6 high · 18 medium of 1,284 scored'
        },
        marked_as_fraud_30d: {
          value: 11,
          subtext: '11 orders'
        },
        orders_that_came_back: {
          value: repeatCount,
          subtext: 'returned or undelivered orders in 6 months'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET held orders waiting for decision
router.get('/held', (req, res) => {
  try {
    const heldOrders = db.prepare(`
      SELECT * FROM orders 
      WHERE is_held_for_review = 1 
      ORDER BY risk_score DESC
    `).all();

    res.json({
      success: true,
      orders: heldOrders.map(o => ({
        id: o.id,
        customer: o.customer_name,
        phone: o.customer_phone,
        risk_score: o.risk_score,
        reason: o.hold_reason || 'Flagged by rule check',
        total: o.total,
        status: o.status,
        created_at: o.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST decision (approve or reject)
router.post('/decision', async (req, res) => {
  try {
    const { order_id, action, note } = req.body;
    if (!order_id || !action) {
      return res.status(400).json({ success: false, error: 'order_id and action (approve/reject) are required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (action === 'approve') {
      db.prepare(`
        UPDATE orders 
        SET is_held_for_review = 0, status = 'confirmed', hold_reason = ? 
        WHERE id = ?
      `).run(`Approved manually: ${note || 'Verified by admin'}`, order_id);

      await dispatchN8nEvent('fraud.order_approved', {
        order_id: order.id,
        customer_name: order.customer_name,
        action: 'approved'
      });
    } else if (action === 'reject') {
      db.prepare(`
        UPDATE orders 
        SET is_held_for_review = 0, status = 'cancelled', hold_reason = ? 
        WHERE id = ?
      `).run(`Rejected as fraud: ${note || 'Admin rejection'}`, order_id);

      await dispatchN8nEvent('fraud.order_rejected', {
        order_id: order.id,
        customer_name: order.customer_name,
        action: 'rejected'
      });
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    res.json({ success: true, message: `Order ${order_id} ${action}d successfully.`, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET repeat return customers
router.get('/repeat-customers', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM repeat_return_customers ORDER BY returns_count DESC').all();
    res.json({ success: true, customers: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET & PUT settings
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM fraud_settings WHERE id = 1').get();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const { fraud_check_enabled, refuse_blocked, hold_score_threshold, lookback_days } = req.body;
    db.prepare(`
      UPDATE fraud_settings 
      SET fraud_check_enabled = ?, refuse_blocked = ?, hold_score_threshold = ?, lookback_days = ?
      WHERE id = 1
    `).run(
      fraud_check_enabled ? 1 : 0,
      refuse_blocked ? 1 : 0,
      Number(hold_score_threshold) || 60,
      Number(lookback_days) || 30
    );

    const updated = db.prepare('SELECT * FROM fraud_settings WHERE id = 1').get();
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
