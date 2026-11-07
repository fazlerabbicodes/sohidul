const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET webhooks list
router.get('/webhooks', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM n8n_webhooks ORDER BY created_at DESC').all();
    res.json({ success: true, webhooks: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create webhook
router.post('/webhooks', (req, res) => {
  try {
    const { name, event, target_url, secret } = req.body;
    if (!name || !event || !target_url) {
      return res.status(400).json({ success: false, error: 'Name, event, and target_url are required.' });
    }

    const id = `wh-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO n8n_webhooks (id, name, event, target_url, is_active, secret)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(id, name, event, target_url, secret || 'n8n_secret_' + Math.random().toString(36).substring(7));

    const wh = db.prepare('SELECT * FROM n8n_webhooks WHERE id = ?').get(id);
    res.status(201).json({ success: true, webhook: wh });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE webhook
router.delete('/webhooks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM n8n_webhooks WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Webhook deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST test dispatch to n8n webhook
router.post('/test', async (req, res) => {
  try {
    const { target_url, event = 'order.created', sample_data } = req.body;
    if (!target_url) {
      return res.status(400).json({ success: false, error: 'target_url is required.' });
    }

    const payload = sample_data || {
      event,
      timestamp: new Date().toISOString(),
      source: 'CommercePilot AI',
      order: {
        id: 'ORD-TEST-999',
        customer_name: 'Test Customer',
        customer_phone: '01700000000',
        total: 2450,
        payment_method: 'COD • unpaid',
        courier: 'Pathao Courier'
      }
    };

    let statusCode = 0;
    let responseBody = '';

    try {
      const response = await fetch(target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CommercePilot-Test': 'true',
          'X-CommercePilot-Event': event
        },
        body: JSON.stringify(payload)
      });
      statusCode = response.status;
      responseBody = await response.text();
    } catch (netErr) {
      statusCode = 502;
      responseBody = `Connection failed: ${netErr.message}`;
    }

    // Log the test trigger
    const logId = uuidv4();
    db.prepare(`
      INSERT INTO n8n_logs (id, event, direction, endpoint, payload_json, status_code, response_body)
      VALUES (?, ?, 'outbound', ?, ?, ?, ?)
    `).run(logId, event + ':test', target_url, JSON.stringify(payload), statusCode, responseBody.slice(0, 500));

    res.json({
      success: statusCode >= 200 && statusCode < 300,
      status_code: statusCode,
      response_body: responseBody,
      message: statusCode >= 200 && statusCode < 300 
        ? 'Webhook delivered successfully to n8n!' 
        : `Dispatched with response code ${statusCode}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET logs
router.get('/logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM n8n_logs ORDER BY created_at DESC LIMIT 50').all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET downloadable/copyable n8n workflow templates
router.get('/workflows', (req, res) => {
  const workflows = [
    {
      id: 'wf-auto-order-courier',
      name: 'Pathao / SteadFast Courier Auto-Booking',
      description: 'Triggered when CommercePilot confirms an order. Calls SteadFast or Pathao API to automatically generate consignment notes and update order status.',
      event: 'order.created',
      template: {
        name: "CommercePilot to SteadFast Courier Booking",
        nodes: [
          {
            parameters: {
              httpMethod: "POST",
              path: "commercepilot-order",
              responseMode: "onReceived"
            },
            name: "Webhook from CommercePilot",
            type: "n8n-nodes-base.webhook",
            typeVersion: 1,
            position: [250, 300]
          },
          {
            parameters: {
              method: "POST",
              url: "https://portal.steadfast.com.bd/api/v1/create_order",
              sendHeaders: true,
              headerParameters: {
                parameters: [
                  { name: "Api-Key", value: "YOUR_STEADFAST_API_KEY" },
                  { name: "Secret-Key", value: "YOUR_STEADFAST_SECRET" }
                ]
              },
              sendBody: true,
              bodyParameters: {
                parameters: [
                  { name: "invoice", value: "={{ $json.id }}" },
                  { name: "recipient_name", value: "={{ $json.customer_name }}" },
                  { name: "recipient_phone", value: "={{ $json.customer_phone }}" },
                  { name: "recipient_address", value: "={{ $json.delivery_address }}" },
                  { name: "cod_amount", value: "={{ $json.total }}" }
                ]
              }
            },
            name: "Create Courier Consignment",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.1,
            position: [480, 300]
          }
        ]
      }
    },
    {
      id: 'wf-fraud-telegram-alert',
      name: 'High-Risk Fraud Shield Alert to Telegram / Slack',
      description: 'Instantly alerts store owners on Telegram or Slack when Fraud Shield flags repeat returns or suspicious high-value orders.',
      event: 'fraud.flagged',
      template: {
        name: "CommercePilot Fraud Telegram Alert",
        nodes: [
          {
            parameters: {
              httpMethod: "POST",
              path: "commercepilot-fraud",
              responseMode: "onReceived"
            },
            name: "CommercePilot Fraud Webhook",
            type: "n8n-nodes-base.webhook",
            typeVersion: 1,
            position: [250, 300]
          },
          {
            parameters: {
              chatId: "YOUR_TELEGRAM_CHAT_ID",
              text: "⚠️ *COMMERCEPILOT FRAUD ALERT*\n\nOrder: `{{ $json.order.id }}`\nCustomer: {{ $json.order.customer_name }}\nPhone: {{ $json.order.customer_phone }}\nRisk Score: *{{ $json.score }}/100*\nReason: {{ $json.reason }}\n\nAction required in dashboard: /fraud"
            },
            name: "Send Telegram Message",
            type: "n8n-nodes-base.telegram",
            typeVersion: 1,
            position: [480, 300]
          }
        ]
      }
    },
    {
      id: 'wf-fb-graph-sync',
      name: 'Facebook Page Graph API Ingestion Pipeline',
      description: 'Receives live comments and direct messages from Meta Webhooks and routes them into CommercePilot AI for autonomous response generation.',
      event: 'facebook.webhook',
      template: {
        name: "Meta Graph API to CommercePilot Ingestion",
        nodes: [
          {
            parameters: {
              httpMethod: "POST",
              path: "facebook-webhook"
            },
            name: "Meta Webhook Ingest",
            type: "n8n-nodes-base.webhook",
            typeVersion: 1,
            position: [250, 300]
          },
          {
            parameters: {
              method: "POST",
              url: "http://localhost:5000/api/webhooks/facebook",
              sendBody: true,
              specifyBody: "json",
              jsonBody: "={{ JSON.stringify($json) }}"
            },
            name: "Forward to CommercePilot",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4.1,
            position: [480, 300]
          }
        ]
      }
    }
  ];

  res.json({ success: true, workflows });
});

module.exports = router;
