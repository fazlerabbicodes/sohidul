const express = require('express');
const router = express.Router();

let pages = [
  {
    id: 'page-1',
    name: 'Precision Trading BD',
    category: 'Retail & Fashion',
    connected: true,
    followers: '48.2K',
    auto_reply_comments: true,
    auto_send_dm: true,
    manual_approval: false,
    reply_delay_seconds: 3,
    active_conversations: 240
  },
  {
    id: 'page-2',
    name: 'Fashion House BD',
    category: 'Traditional & Modern Apparel',
    connected: true,
    followers: '112.5K',
    auto_reply_comments: true,
    auto_send_dm: true,
    manual_approval: true,
    reply_delay_seconds: 5,
    active_conversations: 185
  },
  {
    id: 'page-3',
    name: 'Gadget Zone BD',
    category: 'Electronics & Smart Accessories',
    connected: true,
    followers: '28.9K',
    auto_reply_comments: true,
    auto_send_dm: false,
    manual_approval: false,
    reply_delay_seconds: 2,
    active_conversations: 78
  }
];

router.get('/', (req, res) => {
  res.json({ success: true, pages });
});

router.patch('/:id', (req, res) => {
  const page = pages.find(p => p.id === req.params.id);
  if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

  Object.assign(page, req.body);
  res.json({ success: true, page });
});

module.exports = router;
