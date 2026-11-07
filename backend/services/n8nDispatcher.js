const db = require('../db');
const { v4: uuidv4 } = require('uuid');

async function dispatchN8nEvent(eventName, payload) {
  try {
    const webhooks = db.prepare(`
      SELECT * FROM n8n_webhooks 
      WHERE is_active = 1 AND (event = ? OR event = '*')
    `).all(eventName);

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    const payloadString = JSON.stringify(payload);

    for (const wh of webhooks) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(wh.target_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CommercePilot-Event': eventName,
            'X-CommercePilot-Signature': wh.secret || ''
          },
          body: payloadString,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const text = await response.text().catch(() => '');

        db.prepare(`
          INSERT INTO n8n_logs (id, event, direction, endpoint, payload_json, status_code, response_body)
          VALUES (?, ?, 'outbound', ?, ?, ?, ?)
        `).run(uuidv4(), eventName, wh.target_url, payloadString, response.status, text.slice(0, 1000));
      } catch (err) {
        db.prepare(`
          INSERT INTO n8n_logs (id, event, direction, endpoint, payload_json, status_code, response_body)
          VALUES (?, ?, 'outbound', ?, ?, ?, ?)
        `).run(uuidv4(), eventName, wh.target_url, payloadString, 0, `Error: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('n8n dispatch error:', err.message);
  }
}

function logInboundWebhook(endpoint, eventName, payload, statusCode, responseBody) {
  try {
    db.prepare(`
      INSERT INTO n8n_logs (id, event, direction, endpoint, payload_json, status_code, response_body)
      VALUES (?, ?, 'inbound', ?, ?, ?, ?)
    `).run(uuidv4(), eventName, endpoint, JSON.stringify(payload), statusCode, typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody));
  } catch (err) {
    console.error('Failed to log inbound webhook:', err.message);
  }
}

module.exports = {
  dispatchN8nEvent,
  logInboundWebhook
};
