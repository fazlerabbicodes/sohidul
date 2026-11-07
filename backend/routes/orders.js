const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { dispatchN8nEvent } = require('../services/n8nDispatcher');

// GET all orders
router.get('/', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all' && status !== 'All statuses') {
      query += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    if (search) {
      query += ` AND (
        id LIKE ? OR 
        customer_name LIKE ? OR 
        customer_phone LIKE ? OR 
        delivery_address LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params);
    res.json({
      success: true,
      total: orders.length,
      orders: orders.map(o => ({
        ...o,
        items: o.items_json ? JSON.parse(o.items_json) : []
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single order
router.get('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    order.items = order.items_json ? JSON.parse(order.items_json) : [];
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create new order
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      delivery_address,
      city_zone = 'Inside Dhaka',
      items = [],
      payment_method = 'COD • unpaid',
      courier = 'SteadFast',
      channel = 'Manual'
    } = req.body;

    if (!customer_name || !customer_phone || !delivery_address) {
      return res.status(400).json({ success: false, error: 'Customer name, phone, and address are required.' });
    }

    const id = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const subtotal = items.reduce((acc, it) => acc + (Number(it.price) * Number(it.qty || 1)), 0) || 1500;
    const delivery_fee = city_zone.toLowerCase().includes('outside') ? 130 : 80;
    const total = subtotal + delivery_fee;

    // Calculate risk score based on customer phone return history & amount
    let risk_score = 10;
    let risk_level = 'Low';
    let is_held = 0;
    let hold_reason = null;

    const repeatCheck = db.prepare('SELECT * FROM repeat_return_customers WHERE phone = ? OR name = ?').get(customer_phone, customer_name);
    if (repeatCheck) {
      risk_score = 90;
      risk_level = 'High';
      is_held = 1;
      hold_reason = `Repeat failed deliveries (${repeatCheck.returns_count} returns in history).`;
    } else if (subtotal > 20000) {
      risk_score = 75;
      risk_level = 'Medium';
      is_held = 1;
      hold_reason = `Unusually large order (৳${subtotal.toLocaleString()}).`;
    }

    const status = is_held ? 'held' : 'confirmed';

    db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_phone, delivery_address, city_zone,
        subtotal, delivery_fee, total, payment_method, payment_status,
        risk_level, risk_score, status, courier, channel, items_json,
        is_held_for_review, hold_reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      id, customer_name, customer_phone, delivery_address, city_zone,
      subtotal, delivery_fee, total, payment_method, payment_method.includes('Paid') ? 'paid' : 'unpaid',
      risk_level, risk_score, status, courier, channel, JSON.stringify(items),
      is_held, hold_reason
    );

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    createdOrder.items = items;

    // Dispatch n8n event
    await dispatchN8nEvent('order.created', createdOrder);
    if (is_held) {
      await dispatchN8nEvent('fraud.flagged', { order: createdOrder, reason: hold_reason, score: risk_score });
    }

    res.status(201).json({ success: true, order: createdOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    // Dispatch n8n status update
    await dispatchN8nEvent('order.status_updated', {
      order_id: updated.id,
      previous_status: order.status,
      new_status: status,
      customer_name: updated.customer_name,
      customer_phone: updated.customer_phone,
      total: updated.total,
      courier: updated.courier
    });

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST return items
router.post('/:id/return', async (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Update order status to returned
    db.prepare("UPDATE orders SET status = 'returned' WHERE id = ?").run(order.id);

    // Track return against customer
    const existing = db.prepare('SELECT * FROM repeat_return_customers WHERE phone = ?').get(order.customer_phone);
    if (existing) {
      db.prepare('UPDATE repeat_return_customers SET returns_count = returns_count + 1, last_order_date = CURRENT_TIMESTAMP WHERE id = ?')
        .run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO repeat_return_customers (id, name, phone, returns_count, last_order_date)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(uuidv4(), order.customer_name, order.customer_phone);
    }

    // Dispatch n8n event
    await dispatchN8nEvent('order.returned', {
      order_id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      amount: order.total,
      courier: order.courier
    });

    res.json({
      success: true,
      message: `Order ${order.id} returned successfully. Items restored and customer return history updated.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
