const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { dispatchN8nEvent } = require('../services/n8nDispatcher');

// GET threads list
router.get('/threads', (req, res) => {
  try {
    const { tab, search } = req.query;
    let query = 'SELECT * FROM messenger_threads WHERE 1=1';
    const params = [];

    if (tab === 'needs_human') {
      query += ' AND needs_human = 1';
    } else if (tab === 'bot_active') {
      query += ' AND bot_active = 1';
    }

    if (search) {
      query += ` AND (
        customer_name LIKE ? OR 
        customer_phone LIKE ? OR 
        last_message LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY updated_at DESC';

    const threads = db.prepare(query).all(...params);

    const counts = {
      all: db.prepare('SELECT COUNT(*) as c FROM messenger_threads').get().c,
      needs_human: db.prepare('SELECT COUNT(*) as c FROM messenger_threads WHERE needs_human = 1').get().c,
      bot_active: db.prepare('SELECT COUNT(*) as c FROM messenger_threads WHERE bot_active = 1').get().c
    };

    res.json({ success: true, counts, threads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET thread details & messages
router.get('/threads/:id', (req, res) => {
  try {
    const thread = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(req.params.id);
    if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });

    const messages = db.prepare('SELECT * FROM messenger_messages WHERE thread_id = ? ORDER BY created_at ASC').all(req.params.id);

    res.json({
      success: true,
      thread,
      messages: messages.map(m => ({
        ...m,
        payload: m.payload_json ? JSON.parse(m.payload_json) : null
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST send message
router.post('/threads/:id/messages', async (req, res) => {
  try {
    const { sender = 'agent', text, message_type = 'text', payload } = req.body;
    const thread = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(req.params.id);
    if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });

    const msgId = `msg-${Date.now().toString(36)}`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    db.prepare(`
      INSERT INTO messenger_messages (id, thread_id, sender, text, message_type, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(msgId, thread.id, sender, text, message_type, payload ? JSON.stringify(payload) : null, now);

    db.prepare(`
      UPDATE messenger_threads 
      SET last_message = ?, last_message_time = 'Just now', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(text, thread.id);

    const createdMsg = db.prepare('SELECT * FROM messenger_messages WHERE id = ?').get(msgId);
    createdMsg.payload = payload;

    // Dispatch n8n event
    await dispatchN8nEvent('messenger.message_sent', {
      thread_id: thread.id,
      customer_name: thread.customer_name,
      customer_phone: thread.customer_phone,
      message: createdMsg
    });

    res.status(201).json({ success: true, message: createdMsg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST toggle bot
router.patch('/threads/:id/toggle-bot', async (req, res) => {
  try {
    const thread = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(req.params.id);
    if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });

    const newBotActive = thread.bot_active ? 0 : 1;
    const newNeedsHuman = newBotActive ? 0 : 1;

    db.prepare('UPDATE messenger_threads SET bot_active = ?, needs_human = ? WHERE id = ?')
      .run(newBotActive, newNeedsHuman, thread.id);

    const updated = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(thread.id);
    res.json({ success: true, thread: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST confirm order from chat card
router.post('/threads/:id/confirm-order', async (req, res) => {
  try {
    const thread = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(req.params.id);
    if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add order to orders table
    db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_phone, delivery_address, city_zone,
        subtotal, delivery_fee, total, payment_method, payment_status,
        risk_level, risk_score, status, courier, channel, items_json,
        is_held_for_review, created_at
      ) VALUES (?, ?, ?, 'house 22, apt#3B, north badda, dhaka', 'Inside Dhaka', 5850, 80, 5930, 'COD • unpaid', 'unpaid', 'Low', 12, 'confirmed', 'SteadFast', 'Messenger AI', ?, 0, CURRENT_TIMESTAMP)
    `).run(orderId, thread.customer_name, thread.customer_phone || '01998048911', JSON.stringify([{ name: 'Panjabi (Eid Collection)', qty: 3, price: 5850 }]));

    // 2. Add confirmation messages in chat
    db.prepare(`
      INSERT INTO messenger_messages (id, thread_id, sender, text, message_type, payload_json, created_at)
      VALUES (?, ?, 'bot', ?, 'order_confirmation', ?, ?)
    `).run(`msg-${Date.now()}-1`, thread.id, `Order #${orderId} created by AI — ৳5,930 COD · ${now}`, JSON.stringify({ order_id: orderId, total: 5930 }), now);

    db.prepare(`
      INSERT INTO messenger_messages (id, thread_id, sender, text, message_type, payload_json, created_at)
      VALUES (?, ?, 'bot', ?, 'text', NULL, ?)
    `).run(`msg-${Date.now()}-2`, thread.id, `✅ Your order #${orderId} has been placed! Total ৳5,930 — pay cash on delivery. Expected delivery: 24-48 hours. Thank you for shopping with us 🙏`, now);

    // 3. Update thread state
    db.prepare(`
      UPDATE messenger_threads 
      SET order_id = ?, order_status = 'Confirmed', order_amount = 5930, last_message = ? 
      WHERE id = ?
    `).run(orderId, `Order #${orderId} confirmed!`, thread.id);

    const updatedThread = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(thread.id);

    // Dispatch n8n event
    await dispatchN8nEvent('order.created_from_chat', {
      thread_id: thread.id,
      order_id: orderId,
      customer_name: thread.customer_name,
      total: 5930
    });

    res.json({
      success: true,
      order_id: orderId,
      thread: updatedThread,
      message: 'Order successfully confirmed by AI bot!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST simulate customer
router.post('/simulate', async (req, res) => {
  try {
    const { name = 'Tanvir Khan', phone = '01755112233', text = 'Panjabi Eid collection size L er stock ache?' } = req.body;
    const threadId = `th-${name.toLowerCase().replace(/ /g, '-')}`;

    let thread = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(threadId);
    if (!thread) {
      db.prepare(`
        INSERT INTO messenger_threads (
          id, customer_name, customer_avatar, customer_phone, psid, page_name,
          last_message, last_message_time, bot_active, needs_human, order_id,
          order_status, order_amount, started_from_comment, is_window_closed, customer_since
        ) VALUES (?, ?, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', ?, ?, 'Precision Trading BD', ?, 'Just now', 1, 0, NULL, 'New', 0, ?, 0, CURRENT_TIMESTAMP)
      `).run(threadId, name, phone, `4009${Math.floor(1000000000 + Math.random() * 9000000000)}`, text, text);
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Customer message
    db.prepare(`
      INSERT INTO messenger_messages (id, thread_id, sender, text, message_type, created_at)
      VALUES (?, ?, 'customer', ?, 'text', ?)
    `).run(`msg-${Date.now()}-c`, threadId, text, now);

    // AI bot automatic response
    const botReply = `Hi ${name}! 👋 Yes, Panjabi Eid collection size L is in stock (৳1,950). Would you like to confirm an order? Please share your delivery address and contact number.`;
    db.prepare(`
      INSERT INTO messenger_messages (id, thread_id, sender, text, message_type, created_at)
      VALUES (?, ?, 'bot', ?, 'text', ?)
    `).run(`msg-${Date.now()}-b`, threadId, botReply, now);

    db.prepare('UPDATE messenger_threads SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(botReply, threadId);

    const updated = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(threadId);

    await dispatchN8nEvent('messenger.incoming', {
      thread_id: threadId,
      customer_name: name,
      customer_phone: phone,
      text,
      bot_reply: botReply
    });

    res.json({ success: true, thread: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
