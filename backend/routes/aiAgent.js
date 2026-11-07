const express = require('express');
const router = express.Router();

let agentConfig = {
  name: 'CommercePilot Autonomous Sales Assistant',
  persona: 'Friendly Bangladeshi eCommerce Sales Rep',
  language: 'Bilingual (Bangla / Banglish / English)',
  sales_tone: 'Polite, persuasive, concise',
  autonomous_order_taking: true,
  auto_calculate_inside_dhaka_delivery: 80,
  auto_calculate_outside_dhaka_delivery: 130,
  max_discount_percentage: 10,
  require_human_confirmation_over_bdt: 15000,
  operating_hours: '24/7 Continuous Autopilot'
};

router.get('/config', (req, res) => {
  res.json({ success: true, config: agentConfig });
});

router.put('/config', (req, res) => {
  Object.assign(agentConfig, req.body);
  res.json({ success: true, message: 'AI Agent settings updated successfully', config: agentConfig });
});

module.exports = router;
