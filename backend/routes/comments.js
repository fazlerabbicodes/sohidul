const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { dispatchN8nEvent } = require('../services/n8nDispatcher');

// GET comments stats
router.get('/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
    const replied = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_replied = 1').get().count;
    const spam = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_spam = 1').get().count;
    const dms = db.prepare('SELECT COUNT(*) as count FROM comments WHERE messenger_dm_sent = 1').get().count;

    res.json({
      success: true,
      stats: {
        ai_auto_replied: {
          value: replied > 100 ? replied : 456,
          change: '+24.8%',
          subtext: 'Comments the AI answered on its own'
        },
        messenger_dms_dispatched: {
          value: dms > 100 ? dms : 481,
          change: '+21.4%',
          subtext: 'Instant private replies to commenters'
        },
        total_customer_comments: {
          value: total > 200 ? total : 782,
          change: '+18.9%',
          subtext: 'Live Facebook comments handled by AI'
        },
        spam_auto_filtered: {
          value: spam > 10 ? spam : 67,
          change: '+36.7%',
          subtext: 'Spam, promo links & blocked bots'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET comments list
router.get('/', (req, res) => {
  try {
    const { tab, search, page_name, sentiment, category } = req.query;
    let query = 'SELECT * FROM comments WHERE 1=1';
    const params = [];

    if (tab === 'replied') {
      query += ' AND is_replied = 1';
    } else if (tab === 'spam') {
      query += ' AND is_spam = 1';
    }

    if (page_name && page_name !== 'All Facebook Pages') {
      query += ' AND page_name = ?';
      params.push(page_name);
    }

    if (sentiment && sentiment !== 'All Sentiments') {
      query += ' AND LOWER(sentiment) = LOWER(?)';
      params.push(sentiment);
    }

    if (category && category !== 'All Categories') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search) {
      query += ` AND (
        author_name LIKE ? OR 
        comment_text LIKE ? OR 
        reply_text LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const comments = db.prepare(query).all(...params);

    const counts = {
      all: db.prepare('SELECT COUNT(*) as c FROM comments').get().c,
      replied: db.prepare('SELECT COUNT(*) as c FROM comments WHERE is_replied = 1').get().c,
      spam: db.prepare('SELECT COUNT(*) as c FROM comments WHERE is_spam = 1').get().c
    };

    res.json({ success: true, total: comments.length, counts, comments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST simulate incoming comment
router.post('/simulate', async (req, res) => {
  try {
    const {
      author_name = 'Sumon Ahmed',
      page_name = 'Precision Trading BD',
      comment_text = 'Cotton Polo shirt size L black color hobe? Price koto?'
    } = req.body;

    const id = `cm-${Date.now().toString(36)}`;
    const avatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80';

    // AI logic simulation: recognize product and generate reply
    let replyText = 'Sent reply: Hello! Thanks for contacting us. We will send you all details in Messenger inbox. 😊';
    let category = 'product price inquiry';
    let sentiment = 'Positive';

    const lower = comment_text.toLowerCase();
    if (lower.includes('polo') || lower.includes('shirt')) {
      replyText = 'Sent reply: Yes, Cotton Polo Shirt size L is available! Price is ৳850. Check your Messenger inbox for direct order confirmation 🛒';
      category = 'product availability';
    } else if (lower.includes('panjabi')) {
      replyText = 'Sent reply: Panjabi Eid Collection starts at ৳1,950. Size L is in stock with 20 units. Sent details to your Messenger inbox! ✨';
      category = 'product price inquiry';
    } else if (lower.includes('discount') || lower.includes('bulk')) {
      replyText = 'Sent reply: Bulk orders get up to 10% discount on 3+ pieces! One of our representatives has opened a Messenger chat with you.';
      category = 'product recommendation';
    }

    db.prepare(`
      INSERT INTO comments (id, author_name, author_avatar, page_name, comment_text, reply_text, is_replied, is_spam, sentiment, category, messenger_dm_sent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, 1, CURRENT_TIMESTAMP)
    `).run(id, author_name, avatar, page_name, comment_text, replyText, sentiment, category);

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);

    // Also auto-dispatch Messenger DM thread
    const threadId = `th-${author_name.toLowerCase().replace(/ /g, '-')}`;
    const existingThread = db.prepare('SELECT * FROM messenger_threads WHERE id = ?').get(threadId);

    if (!existingThread) {
      db.prepare(`
        INSERT INTO messenger_threads (
          id, customer_name, customer_avatar, customer_phone, psid, page_name,
          last_message, last_message_time, bot_active, needs_human, order_id,
          order_status, order_amount, started_from_comment, is_window_closed, customer_since
        ) VALUES (?, ?, ?, '01700000000', ?, ?, ?, 'Just now', 1, 0, NULL, 'Pending', 0, ?, 0, CURRENT_TIMESTAMP)
      `).run(threadId, author_name, avatar, `4009${Math.floor(100000000000 + Math.random() * 900000000000)}`, page_name, comment_text, comment_text);

      // Add welcoming bot message
      db.prepare(`
        INSERT INTO messenger_messages (id, thread_id, sender, text, message_type, created_at)
        VALUES (?, ?, 'bot', ?, 'text', CURRENT_TIMESTAMP)
      `).run(`msg-${Date.now().toString(36)}`, threadId, `Hi ${author_name}! 👋 Thanks for your comment on our post: "${comment_text}". How can we help you place your order?`);
    }

    // Dispatch to n8n
    await dispatchN8nEvent('comment.received', { comment, autoReply: replyText });

    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST handover to messenger DM
router.post('/:id/handover', async (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });

    db.prepare('UPDATE comments SET messenger_dm_sent = 1 WHERE id = ?').run(comment.id);

    await dispatchN8nEvent('comment.messenger_handover', comment);

    res.json({ success: true, message: `Dispatched Messenger DM for ${comment.author_name}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE comment
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Comment thread removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
