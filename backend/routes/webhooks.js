const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { logInboundWebhook } = require('../services/n8nDispatcher');

// Inbound webhook from n8n: Create Order
router.post('/n8n/order', (req, res) => {
  try {
    const payload = req.body;
    const customer_name = payload.customer_name || payload.recipient_name || 'n8n Automated Customer';
    const customer_phone = payload.customer_phone || payload.recipient_phone || '01700000000';
    const delivery_address = payload.delivery_address || payload.recipient_address || 'Dhaka';
    const subtotal = Number(payload.subtotal || payload.amount || 1500);
    const delivery_fee = Number(payload.delivery_fee || 80);
    const total = subtotal + delivery_fee;
    const courier = payload.courier || 'SteadFast';
    const orderId = payload.id || `ORD-N8N-${Math.floor(10000 + Math.random() * 90000)}`;

    db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_phone, delivery_address, city_zone,
        subtotal, delivery_fee, total, payment_method, payment_status,
        risk_level, risk_score, status, courier, channel, items_json,
        is_held_for_review, created_at
      ) VALUES (?, ?, ?, ?, 'Inside Dhaka', ?, ?, ?, 'COD • unpaid', 'unpaid', 'Low', 10, 'confirmed', ?, 'n8n Automation', ?, 0, CURRENT_TIMESTAMP)
    `).run(orderId, customer_name, customer_phone, delivery_address, subtotal, delivery_fee, total, courier, JSON.stringify(payload.items || [{ name: 'Synced Item', qty: 1, price: subtotal }]));

    const response = { success: true, message: 'Order ingested from n8n successfully', order_id: orderId };
    logInboundWebhook('/api/webhooks/n8n/order', 'order.n8n_ingest', payload, 200, response);

    res.status(201).json(response);
  } catch (err) {
    logInboundWebhook('/api/webhooks/n8n/order', 'order.n8n_ingest', req.body, 500, { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// Inbound webhook from n8n: Import Lead
router.post('/n8n/lead', (req, res) => {
  try {
    const payload = req.body;
    const id = `lead-n8n-${Date.now().toString(36)}`;

    db.prepare(`
      INSERT INTO leads (id, business_name, website, phone, email, location, category, source, pipeline_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'n8n', ?, ?)
    `).run(
      id,
      payload.business_name || 'Discovered Enterprise',
      payload.website || '',
      payload.phone || '',
      payload.email || '',
      payload.location || 'Dhaka, Bangladesh',
      payload.category || 'General Outbound',
      payload.pipeline_status || 'new',
      payload.notes || 'Imported via n8n workflow'
    );

    const response = { success: true, message: 'Lead imported from n8n successfully', lead_id: id };
    logInboundWebhook('/api/webhooks/n8n/lead', 'lead.n8n_import', payload, 201, response);

    res.status(201).json(response);
  } catch (err) {
    logInboundWebhook('/api/webhooks/n8n/lead', 'lead.n8n_import', req.body, 500, { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// Inbound webhook from n8n: Update Inventory Stock
router.post('/n8n/inventory', (req, res) => {
  try {
    const { sku, in_stock, delta } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE sku = ?').get(sku);

    if (!product) {
      return res.status(404).json({ success: false, error: `Product with SKU ${sku} not found` });
    }

    let newStock = product.in_stock;
    if (in_stock !== undefined) {
      newStock = Number(in_stock);
    } else if (delta !== undefined) {
      newStock = Math.max(0, newStock + Number(delta));
    }

    const status = newStock > 30 ? 'in_stock' : newStock > 0 ? 'low_stock' : 'out_of_stock';
    db.prepare('UPDATE products SET in_stock = ?, status = ? WHERE id = ?').run(newStock, status, product.id);

    const response = { success: true, sku, previous_stock: product.in_stock, new_stock: newStock, status };
    logInboundWebhook('/api/webhooks/n8n/inventory', 'inventory.n8n_sync', req.body, 200, response);

    res.json(response);
  } catch (err) {
    logInboundWebhook('/api/webhooks/n8n/inventory', 'inventory.n8n_sync', req.body, 500, { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// Meta Facebook Graph Webhook endpoint (GET for verification, POST for event payloads)
router.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe') {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

router.post('/facebook', (req, res) => {
  try {
    const body = req.body;
    logInboundWebhook('/api/webhooks/facebook', 'facebook.graph_event', body, 200, { received: true });
    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
