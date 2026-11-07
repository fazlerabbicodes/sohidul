const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, 'commercepilot_db.json');

// Memory store of tables
let tables = {
  products: [],
  orders: [],
  fraud_settings: [],
  repeat_return_customers: [],
  leads: [],
  comments: [],
  messenger_threads: [],
  messenger_messages: [],
  subscription: [],
  payments: [],
  notifications: [],
  n8n_webhooks: [],
  n8n_logs: []
};

function saveToDisk() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(tables, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save DB to disk:', err.message);
  }
}

function loadFromDisk() {
  if (fs.existsSync(dbFilePath)) {
    try {
      const data = fs.readFileSync(dbFilePath, 'utf8');
      tables = JSON.parse(data);
      return true;
    } catch (err) {
      console.error('Failed to parse existing DB file, re-initializing:', err.message);
    }
  }
  return false;
}

// Emulate SQLite prepare/all/get/run interface
function prepare(sql) {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  return {
    all: (...params) => {
      return executeQuery(trimmed, params, 'all');
    },
    get: (...params) => {
      const results = executeQuery(trimmed, params, 'all');
      return results && results.length > 0 ? results[0] : null;
    },
    run: (...params) => {
      return executeRun(trimmed, params);
    }
  };
}

function executeQuery(sql, params, mode) {
  const lower = sql.toLowerCase();

  // SELECT COUNT(*) FROM orders
  if (lower.includes('select count(*)')) {
    const tableMatch = lower.match(/from\s+([a-z0-9_]+)/);
    if (!tableMatch) return [{ count: 0, cnt: 0, c: 0 }];
    const tbl = tableMatch[1];
    let rows = tables[tbl] || [];

    if (lower.includes('where')) {
      rows = filterRows(rows, sql, params);
    }

    const count = rows.length;
    return [{ count, cnt: count, c: count }];
  }

  // SELECT SUM(total) as sum FROM orders
  if (lower.includes('select sum(')) {
    const tableMatch = lower.match(/from\s+([a-z0-9_]+)/);
    const colMatch = lower.match(/sum\(([a-z0-9_]+)\)/);
    if (!tableMatch || !colMatch) return [{ sum: 0, total_units: 0, total: 0 }];
    const tbl = tableMatch[1];
    const col = colMatch[1];
    let rows = tables[tbl] || [];
    if (lower.includes('where')) {
      rows = filterRows(rows, sql, params);
    }
    const sum = rows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
    return [{ sum, total_units: sum, total: sum }];
  }

  // Standard SELECT * FROM tbl ...
  const tableMatch = lower.match(/from\s+([a-z0-9_]+)/);
  if (!tableMatch) return [];
  const tbl = tableMatch[1];
  let rows = [...(tables[tbl] || [])];

  if (lower.includes('where')) {
    rows = filterRows(rows, sql, params);
  }

  // Handle ORDER BY
  if (lower.includes('order by')) {
    if (lower.includes('created_at desc') || lower.includes('updated_at desc') || lower.includes('date desc')) {
      rows.sort((a, b) => (b.created_at || b.date || '').localeCompare(a.created_at || a.date || ''));
    } else if (lower.includes('risk_score desc')) {
      rows.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
    } else if (lower.includes('returns_count desc')) {
      rows.sort((a, b) => (b.returns_count || 0) - (a.returns_count || 0));
    } else if (lower.includes('created_at asc')) {
      rows.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    }
  }

  // Handle LIMIT
  const limitMatch = lower.match(/limit\s+(\d+)/);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1], 10);
    rows = rows.slice(0, limit);
  }

  return rows;
}

function filterRows(rows, sql, params) {
  const lower = sql.toLowerCase();

  return rows.filter((r) => {
    // orders filters
    if (lower.includes("status != 'cancelled'") && r.status === 'cancelled') return false;
    if (lower.includes("channel = 'messenger ai'") && r.channel !== 'Messenger AI') return false;
    if (lower.includes("needs_human = 1") && Number(r.needs_human) !== 1) return false;
    if (lower.includes("bot_active = 1") && Number(r.bot_active) !== 1) return false;
    if (lower.includes("is_held_for_review = 1") && Number(r.is_held_for_review) !== 1) return false;
    if (lower.includes("is_replied = 1") && Number(r.is_replied) !== 1) return false;
    if (lower.includes("is_spam = 1") && Number(r.is_spam) !== 1) return false;
    if (lower.includes("messenger_dm_sent = 1") && Number(r.messenger_dm_sent) !== 1) return false;

    // Params filters (e.g. status = ?, id = ?)
    let pIdx = 0;
    if (lower.includes('status = ?') || lower.includes('lower(status) = lower(?)')) {
      const val = params[pIdx++];
      if (val && String(r.status).toLowerCase() !== String(val).toLowerCase()) return false;
    }
    if (lower.includes('pipeline_status = ?') || lower.includes('lower(pipeline_status) = ?')) {
      const val = params[pIdx++];
      if (val && String(r.pipeline_status).toLowerCase() !== String(val).toLowerCase()) return false;
    }
    if (lower.includes('page_name = ?')) {
      const val = params[pIdx++];
      if (val && r.page_name !== val) return false;
    }
    if (lower.includes('sentiment) = lower(?)')) {
      const val = params[pIdx++];
      if (val && String(r.sentiment).toLowerCase() !== String(val).toLowerCase()) return false;
    }
    if (lower.includes('category) = lower(?)')) {
      const val = params[pIdx++];
      if (val && String(r.category).toLowerCase() !== String(val).toLowerCase()) return false;
    }
    if (lower.includes('thread_id = ?')) {
      const val = params[pIdx++];
      if (val && r.thread_id !== val) return false;
    }
    if (lower.includes('id = ?')) {
      const val = params[pIdx++];
      if (val && String(r.id) !== String(val)) return false;
    }
    if (lower.includes('sku = ?')) {
      const val = params[pIdx++];
      if (val && r.sku !== val) return false;
    }
    if (lower.includes('phone = ? or name = ?')) {
      const p1 = params[pIdx++];
      const p2 = params[pIdx++];
      if (r.phone !== p1 && r.name !== p2) return false;
    } else if (lower.includes('phone = ?')) {
      const val = params[pIdx++];
      if (val && r.phone !== val && r.customer_phone !== val) return false;
    }
    if (lower.includes('is_active = 1 and (event = ? or event = \'*\')')) {
      const val = params[pIdx++];
      if (r.is_active !== 1 || (r.event !== val && r.event !== '*')) return false;
    }

    // Search query with LIKE ?
    if (lower.includes('like ?') && params.length > 0) {
      // Find search term
      const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const term = searchParam.replace(/%/g, '').toLowerCase();
        const str = Object.values(r).join(' ').toLowerCase();
        if (!str.includes(term)) return false;
      }
    }

    return true;
  });
}

function executeRun(sql, params) {
  const lower = sql.toLowerCase();

  // INSERT INTO tbl (...) VALUES (...)
  if (lower.startsWith('insert into')) {
    const tableMatch = lower.match(/insert\s+into\s+([a-z0-9_]+)/);
    if (!tableMatch) return { changes: 0 };
    const tbl = tableMatch[1];
    if (!tables[tbl]) tables[tbl] = [];

    const colsMatch = sql.match(/\(([^)]+)\)\s+values/i);
    if (colsMatch) {
      const cols = colsMatch[1].split(',').map(c => c.trim());
      const newRow = {};
      cols.forEach((col, idx) => {
        newRow[col] = params[idx] !== undefined ? params[idx] : null;
      });
      if (!newRow.created_at) newRow.created_at = new Date().toISOString();
      tables[tbl].push(newRow);
      saveToDisk();
      return { changes: 1, lastInsertRowid: newRow.id || tables[tbl].length };
    }
  }

  // UPDATE tbl SET ... WHERE id = ?
  if (lower.startsWith('update')) {
    const tableMatch = lower.match(/update\s+([a-z0-9_]+)/);
    if (!tableMatch) return { changes: 0 };
    const tbl = tableMatch[1];
    const list = tables[tbl] || [];

    // Check target ID
    const targetId = params[params.length - 1];
    const row = list.find(r => String(r.id) === String(targetId));

    if (row) {
      if (lower.includes('orders set status = ?')) {
        row.status = params[0];
      } else if (lower.includes('is_held_for_review = 0, status = \'confirmed\'')) {
        row.is_held_for_review = 0;
        row.status = 'confirmed';
        row.hold_reason = params[0];
      } else if (lower.includes('is_held_for_review = 0, status = \'cancelled\'')) {
        row.is_held_for_review = 0;
        row.status = 'cancelled';
        row.hold_reason = params[0];
      } else if (lower.includes('orders set status = \'returned\'')) {
        row.status = 'returned';
      } else if (lower.includes('repeat_return_customers set returns_count = returns_count + 1')) {
        row.returns_count = (row.returns_count || 1) + 1;
        row.last_order_date = new Date().toISOString();
      } else if (lower.includes('fraud_settings')) {
        row.fraud_check_enabled = params[0];
        row.refuse_blocked = params[1];
        row.hold_score_threshold = params[2];
        row.lookback_days = params[3];
      } else if (lower.includes('products set in_stock = ?, status = ?')) {
        row.in_stock = params[0];
        row.status = params[1];
      } else if (lower.includes('leads set pipeline_status = ?')) {
        row.pipeline_status = params[0];
      } else if (lower.includes('comments set messenger_dm_sent = 1')) {
        row.messenger_dm_sent = 1;
      } else if (lower.includes('messenger_threads set bot_active = ?, needs_human = ?')) {
        row.bot_active = params[0];
        row.needs_human = params[1];
      } else if (lower.includes('messenger_threads set order_id = ?, order_status = ?')) {
        row.order_id = params[0];
        row.order_status = 'Confirmed';
        row.order_amount = params[2];
        row.last_message = params[3];
      } else if (lower.includes('messenger_threads set last_message = ?')) {
        row.last_message = params[0];
        row.updated_at = new Date().toISOString();
      } else if (lower.includes('products set name = ?')) {
        row.name = params[0];
        row.sku = params[1];
        row.price = params[2];
        row.category = params[3];
        row.in_stock = params[4];
        row.status = params[5];
        row.image = params[6];
        row.variants_json = params[7];
      }
      saveToDisk();
      return { changes: 1 };
    }
  }

  // DELETE FROM tbl WHERE id = ?
  if (lower.startsWith('delete from')) {
    const tableMatch = lower.match(/delete\s+from\s+([a-z0-9_]+)/);
    if (!tableMatch) return { changes: 0 };
    const tbl = tableMatch[1];
    const targetId = params[0];
    const prevLen = (tables[tbl] || []).length;
    tables[tbl] = (tables[tbl] || []).filter(r => String(r.id) !== String(targetId));
    saveToDisk();
    return { changes: prevLen - tables[tbl].length };
  }

  return { changes: 0 };
}

function exec(sql) {
  // Schema creation no-op for JSON store
}

function seedData() {
  if (tables.products && tables.products.length > 0) return;

  console.log('🌱 Seeding initial CommercePilot data into memory & JSON store...');

  // Products
  tables.products = [
    {
      id: 'prod-001',
      name: 'Panjabi (Eid Collection)',
      sku: 'PAN-001',
      price: 1950,
      image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=150&auto=format&fit=crop&q=80',
      category: 'Clothing',
      in_stock: 47,
      status: 'in_stock',
      variants_json: JSON.stringify([{ label: 'Size', values: ['S (0)', 'M (12)', 'L (20)', 'XL (15)'] }]),
      created_at: '2026-10-01T10:00:00Z'
    },
    {
      id: 'prod-002',
      name: 'Cotton Polo Shirt',
      sku: 'POL-001',
      price: 850,
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=150&auto=format&fit=crop&q=80',
      category: 'Clothing',
      in_stock: 98,
      status: 'in_stock',
      variants_json: JSON.stringify([{ label: 'Size', values: ['S (18)', 'M (32)', 'L (31)', 'XL (17)'] }]),
      created_at: '2026-10-02T10:00:00Z'
    },
    {
      id: 'prod-003',
      name: 'Basic T-Shirt (Unisex)',
      sku: 'TSH-002',
      price: 450,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150&auto=format&fit=crop&q=80',
      category: 'Clothing',
      in_stock: 156,
      status: 'in_stock',
      variants_json: JSON.stringify([{ label: 'Size', values: ['S (40)', 'M (52)', 'L (44)', 'XL (20)'] }]),
      created_at: '2026-10-03T10:00:00Z'
    },
    {
      id: 'prod-004',
      name: 'Denim Jeans',
      sku: 'JEAN-003',
      price: 1690,
      image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=150&auto=format&fit=crop&q=80',
      category: 'Clothing',
      in_stock: 36,
      status: 'low_stock',
      variants_json: JSON.stringify([{ label: 'Size', values: ['30 (10)', '32 (14)', '34 (8)', '36 (4)'] }]),
      created_at: '2026-10-04T10:00:00Z'
    },
    {
      id: 'prod-005',
      name: 'Hoodie (Winter)',
      sku: 'HOOD-004',
      price: 1390,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=150&auto=format&fit=crop&q=80',
      category: 'Clothing',
      in_stock: 28,
      status: 'low_stock',
      variants_json: JSON.stringify([{ label: 'Size', values: ['M (10)', 'L (12)', 'XL (6)'] }]),
      created_at: '2026-10-05T10:00:00Z'
    },
    {
      id: 'prod-006',
      name: 'Casual Sneakers',
      sku: 'SHOE-005',
      price: 2490,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150&auto=format&fit=crop&q=80',
      category: 'Footwear',
      in_stock: 14,
      status: 'out_of_stock',
      variants_json: JSON.stringify([{ label: 'Size', values: ['40 (5)', '41 (4)', '42 (3)', '43 (2)'] }]),
      created_at: '2026-10-06T10:00:00Z'
    },
    {
      id: 'prod-007',
      name: 'Classic Wrist Watch',
      sku: 'WAT-006',
      price: 2990,
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=150&auto=format&fit=crop&q=80',
      category: 'Accessories',
      in_stock: 25,
      status: 'low_stock',
      variants_json: JSON.stringify([{ label: 'Color', values: ['Black (10)', 'Silver (8)', 'Brown (7)'] }]),
      created_at: '2026-10-07T10:00:00Z'
    },
    {
      id: 'prod-008',
      name: 'Laptop Backpack (15.6")',
      sku: 'BAG-007',
      price: 1590,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&auto=format&fit=crop&q=80',
      category: 'Bags',
      in_stock: 63,
      status: 'in_stock',
      variants_json: JSON.stringify([{ label: 'Color', values: ['Black (30)', 'Navy (20)', 'Grey (13)'] }]),
      created_at: '2026-10-08T10:00:00Z'
    },
    {
      id: 'prod-009',
      name: 'Wireless Earbuds',
      sku: 'EARB-008',
      price: 1999,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150&auto=format&fit=crop&q=80',
      category: 'Electronics',
      in_stock: 41,
      status: 'in_stock',
      variants_json: JSON.stringify([{ label: 'Color', values: ['Black (20)', 'White (21)'] }]),
      created_at: '2026-10-09T10:00:00Z'
    },
    {
      id: 'prod-010',
      name: 'Smart Watch (Fitness)',
      sku: 'SW-009',
      price: 3490,
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=150&auto=format&fit=crop&q=80',
      category: 'Electronics',
      in_stock: 19,
      status: 'low_stock',
      variants_json: JSON.stringify([{ label: 'Color', values: ['Black (9)', 'Blue (6)', 'Green (4)'] }]),
      created_at: '2026-10-10T10:00:00Z'
    }
  ];

  // Orders
  tables.orders = [
    {
      id: 'ORD-105452',
      customer_name: 'Rafiqul Hasan',
      customer_phone: '01712345678',
      delivery_address: 'House 12, Road 4, Mirpur-10, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 1910,
      delivery_fee: 80,
      total: 1990,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'Low',
      risk_score: 12,
      status: 'confirmed',
      courier: 'Local courier',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Panjabi (Eid Collection)', qty: 1, price: 1910 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-03 10:24:00'
    },
    {
      id: 'ORD-105451',
      customer_name: 'Tasmia Akter',
      customer_phone: '01987654321',
      delivery_address: 'Flat B-5, Block C, Bashundhara, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 2400,
      delivery_fee: 80,
      total: 2480,
      payment_method: 'Paid (bKash)',
      payment_status: 'paid',
      risk_level: 'Low',
      risk_score: 15,
      status: 'processing',
      courier: 'SteadFast',
      channel: 'Facebook Comment',
      items_json: JSON.stringify([{ name: 'Cotton Polo Shirt', qty: 2, price: 1700 }, { name: 'Basic T-Shirt', qty: 1, price: 700 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-03 09:56:00'
    },
    {
      id: 'ORD-105450',
      customer_name: 'Imran Hossain',
      customer_phone: '01678901234',
      delivery_address: 'Chowrasta, Gazipur Sadar, Gazipur',
      city_zone: 'Outside Dhaka',
      subtotal: 3400,
      delivery_fee: 80,
      total: 3480,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'Medium',
      risk_score: 45,
      status: 'packed',
      courier: 'Pathao Courier',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Smart Watch (Fitness)', qty: 1, price: 3400 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-03 08:37:00'
    },
    {
      id: 'ORD-105449',
      customer_name: 'Nusrat Jahan',
      customer_phone: '01823456789',
      delivery_address: 'House 25, Road 7, Uttara, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 1570,
      delivery_fee: 80,
      total: 1650,
      payment_method: 'Paid (Nagad)',
      payment_status: 'paid',
      risk_level: 'Low',
      risk_score: 10,
      status: 'shipped',
      courier: 'RedX',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Laptop Backpack (15.6")', qty: 1, price: 1570 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-03 07:15:00'
    },
    {
      id: 'ORD-105448',
      customer_name: 'Arifur Rahman',
      customer_phone: '01765432109',
      delivery_address: 'Ward 5, Bogra Sadar, Bogra',
      city_zone: 'Outside Dhaka',
      subtotal: 2120,
      delivery_fee: 80,
      total: 2200,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'Low',
      risk_score: 22,
      status: 'out_for_delivery',
      courier: 'Pathao Courier',
      channel: 'Lead Discovery',
      items_json: JSON.stringify([{ name: 'Denim Jeans', qty: 1, price: 1690 }, { name: 'Basic T-Shirt', qty: 1, price: 430 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-02 16:40:00'
    },
    {
      id: 'ORD-105447',
      customer_name: 'Sadia Islam',
      customer_phone: '01933445566',
      delivery_address: 'Holding 18, Agrabad, Chattogram',
      city_zone: 'Outside Dhaka',
      subtotal: 4510,
      delivery_fee: 80,
      total: 4590,
      payment_method: 'Paid (Card)',
      payment_status: 'paid',
      risk_level: 'Low',
      risk_score: 8,
      status: 'delivered',
      courier: 'SteadFast',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Classic Wrist Watch', qty: 1, price: 2990 }, { name: 'Laptop Backpack', qty: 1, price: 1520 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-02 14:12:00'
    },
    {
      id: 'ORD-105446',
      customer_name: 'Mahmudul Karim',
      customer_phone: '01566778899',
      delivery_address: 'Rampura, Banasree, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 1700,
      delivery_fee: 80,
      total: 1780,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'Medium',
      risk_score: 52,
      status: 'confirmed',
      courier: 'Local courier',
      channel: 'Facebook Comment',
      items_json: JSON.stringify([{ name: 'Cotton Polo Shirt', qty: 2, price: 1700 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-02 11:05:00'
    },
    {
      id: 'ORD-105445',
      customer_name: 'Shahin Alam',
      customer_phone: '01711223344',
      delivery_address: 'Khalishpur, Khulna',
      city_zone: 'Outside Dhaka',
      subtotal: 2910,
      delivery_fee: 80,
      total: 2990,
      payment_method: 'Paid (bKash)',
      payment_status: 'paid',
      risk_level: 'Low',
      risk_score: 18,
      status: 'processing',
      courier: 'RedX',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Classic Wrist Watch', qty: 1, price: 2910 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-01 19:20:00'
    },
    {
      id: 'ORD-105444',
      customer_name: 'Farzana Akter',
      customer_phone: '01855667788',
      delivery_address: 'Mymensingh Sadar, Mymensingh',
      city_zone: 'Outside Dhaka',
      subtotal: 1870,
      delivery_fee: 80,
      total: 1950,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'Low',
      risk_score: 25,
      status: 'packed',
      courier: 'Pathao Courier',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Panjabi (Eid Collection)', qty: 1, price: 1870 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-01 15:30:00'
    },
    {
      id: 'ORD-105443',
      customer_name: 'Abdullah Al Noman',
      customer_phone: '01611223377',
      delivery_address: 'Sylhet Sadar, Sylhet',
      city_zone: 'Outside Dhaka',
      subtotal: 3910,
      delivery_fee: 80,
      total: 3990,
      payment_method: 'Paid (Nagad)',
      payment_status: 'paid',
      risk_level: 'Low',
      risk_score: 14,
      status: 'shipped',
      courier: 'SteadFast',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Smart Watch (Fitness)', qty: 1, price: 3490 }, { name: 'Basic T-Shirt', qty: 1, price: 420 }]),
      is_held_for_review: 0,
      hold_reason: null,
      created_at: '2026-11-01 10:18:00'
    },
    // Fraud Held
    {
      id: '#CP-10873',
      customer_name: 'Arafat Hossain',
      customer_phone: '01719882233',
      delivery_address: 'Mirpur-2, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 3820,
      delivery_fee: 80,
      total: 3900,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'High',
      risk_score: 92,
      status: 'held',
      courier: 'Pathao Courier',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Panjabi (Eid Collection)', qty: 2, price: 3820 }]),
      is_held_for_review: 1,
      hold_reason: 'Repeat failed deliveries (2 returns in last 30 days).',
      created_at: '2026-11-03 11:30:00'
    },
    {
      id: '#CP-10872',
      customer_name: 'Nusrat Jahan',
      customer_phone: '01899112233',
      delivery_address: 'Uttara Sector 11, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 5120,
      delivery_fee: 80,
      total: 5200,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'High',
      risk_score: 88,
      status: 'held',
      courier: 'SteadFast',
      channel: 'Facebook Comment',
      items_json: JSON.stringify([{ name: 'Casual Sneakers', qty: 2, price: 4980 }]),
      is_held_for_review: 1,
      hold_reason: 'Multiple phone numbers (3 different numbers in recent orders).',
      created_at: '2026-11-03 11:15:00'
    },
    {
      id: '#CP-10871',
      customer_name: 'Tanvir Ahmed',
      customer_phone: '01722334455',
      delivery_address: 'Dhanmondi 27, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 10200,
      delivery_fee: 80,
      total: 10280,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'High',
      risk_score: 81,
      status: 'held',
      courier: 'Local courier',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Cotton Polo Shirt', qty: 12, price: 10200 }]),
      is_held_for_review: 1,
      hold_reason: 'Unusually high quantity (ordered 12 units, typical order is 1–3).',
      created_at: '2026-11-03 10:45:00'
    },
    {
      id: '#CP-10870',
      customer_name: 'Sadia Rahman',
      customer_phone: '01633445566',
      delivery_address: 'Panchlaish, Chattogram',
      city_zone: 'Outside Dhaka',
      subtotal: 3390,
      delivery_fee: 80,
      total: 3470,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'Medium',
      risk_score: 76,
      status: 'held',
      courier: 'SteadFast',
      channel: 'Messenger AI',
      items_json: JSON.stringify([{ name: 'Hoodie (Winter)', qty: 2, price: 2780 }]),
      is_held_for_review: 1,
      hold_reason: 'Mismatched address (billing: Dhaka, delivery: Chattogram).',
      created_at: '2026-11-03 09:20:00'
    },
    {
      id: '#CP-10869',
      customer_name: 'Rafid Islam',
      customer_phone: '01944556677',
      delivery_address: 'Gulshan 2, Dhaka',
      city_zone: 'Inside Dhaka',
      subtotal: 24420,
      delivery_fee: 80,
      total: 24500,
      payment_method: 'COD • unpaid',
      payment_status: 'unpaid',
      risk_level: 'Medium',
      risk_score: 68,
      status: 'held',
      courier: 'Local courier',
      channel: 'Lead Discovery',
      items_json: JSON.stringify([{ name: 'Smart Watch (Fitness)', qty: 5, price: 17450 }, { name: 'Wireless Earbuds', qty: 3, price: 5997 }]),
      is_held_for_review: 1,
      hold_reason: 'New customer with large first order (৳24,500, 5x higher than average).',
      created_at: '2026-11-03 08:10:00'
    }
  ];

  // Fraud Settings
  tables.fraud_settings = [
    { id: 1, fraud_check_enabled: 1, refuse_blocked: 1, hold_score_threshold: 60, lookback_days: 30 }
  ];

  // Repeat return customers
  tables.repeat_return_customers = [
    { id: 'ret-1', name: 'Mehedi Hasan', phone: '01711998822', returns_count: 4, last_order_date: 'Nov 27, 2026' },
    { id: 'ret-2', name: 'Farhana Akter', phone: '01822334411', returns_count: 3, last_order_date: 'Nov 25, 2026' },
    { id: 'ret-3', name: 'Ridwan Karim', phone: '01933445522', returns_count: 3, last_order_date: 'Nov 20, 2026' },
    { id: 'ret-4', name: 'Tasmia Rahman', phone: '01644556633', returns_count: 2, last_order_date: 'Nov 18, 2026' }
  ];

  // Leads
  tables.leads = [
    {
      id: 'lead-01',
      business_name: 'GreenLeaf Garments Ltd.',
      website: 'greenleafgarments.com',
      phone: '+880 1712-458963',
      email: 'info@greenleafgarments.com',
      location: 'Gazipur, Bangladesh',
      category: 'Garments & Apparel',
      source: 'discovery',
      pipeline_status: 'in_discussions',
      notes: 'Interested in wholesale Polo shirts.',
      created_at: '2026-11-02T10:00:00Z'
    },
    {
      id: 'lead-02',
      business_name: 'Alif Textiles & Apparels',
      website: 'aliftextiles.com',
      phone: '+880 1789-330221',
      email: 'sales@aliftextiles.com',
      location: 'Dhaka, Bangladesh',
      category: 'Textile & Fabrics',
      source: 'web search',
      pipeline_status: 'qualified',
      notes: 'Sample review scheduled.',
      created_at: '2026-11-02T11:00:00Z'
    },
    {
      id: 'lead-03',
      business_name: 'Bengal Apparels Export Ltd.',
      website: 'bengalapparels.com',
      phone: '+880 1678-990456',
      email: 'contact@bengalapparels.com',
      location: 'Narayanganj, Bangladesh',
      category: 'Garments Exporter',
      source: 'discovery',
      pipeline_status: 'new',
      notes: 'Directory crawl lead.',
      created_at: '2026-11-02T12:00:00Z'
    },
    {
      id: 'lead-04',
      business_name: 'RJS Fashion House',
      website: 'rjsfashionhouse.com',
      phone: '+880 1911-776655',
      email: 'info@rjsfashionhouse.com',
      location: 'Dhaka, Bangladesh',
      category: 'Buying House',
      source: 'directory',
      pipeline_status: 'contacted',
      notes: 'Sent catalog.',
      created_at: '2026-11-02T13:00:00Z'
    },
    {
      id: 'lead-05',
      business_name: 'Prime Stitch Ltd.',
      website: 'primestitch.com',
      phone: '+880 1819-334422',
      email: 'admin@primestitch.com',
      location: 'Gazipur, Bangladesh',
      category: 'Garments & Apparel',
      source: 'web search',
      pipeline_status: 'converted',
      notes: 'Placed first B2B order.',
      created_at: '2026-11-02T14:00:00Z'
    }
  ];

  // Comments
  tables.comments = [
    {
      id: 'cm-001',
      author_name: 'Rafiul Hasan',
      author_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      page_name: 'Precision Trading BD',
      comment_text: 'White polo XL Available??',
      reply_text: 'Sent reply: Yes, our White Cotton Polo Shirt in size XL is in stock! The price is ৳850. You can place an order now from Messenger. 🛒',
      is_replied: 1,
      is_spam: 0,
      sentiment: 'Positive',
      category: 'product availability',
      messenger_dm_sent: 1,
      created_at: 'Nov 03, 2026, 10:24 AM'
    },
    {
      id: 'cm-002',
      author_name: 'Tanisha Akter',
      author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      page_name: 'Fashion House BD',
      comment_text: 'Panjabi price koto? Cl size hobe 3pcs?',
      reply_text: 'Sent reply: Our Eid Collection Panjabi starts from ৳1,950. Yes, size C (L) is available. For 3 pieces, you can get a 5% special discount. Please check your Messenger inbox for details. 😊',
      is_replied: 1,
      is_spam: 0,
      sentiment: 'Neutral',
      category: 'product price inquiry',
      messenger_dm_sent: 1,
      created_at: 'Nov 03, 2026, 09:56 AM'
    },
    {
      id: 'cm-003',
      author_name: 'Imran Hossain',
      author_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      page_name: 'Gadget Zone BD',
      comment_text: 'Office use er jonno best laptop konta suggest korben?',
      reply_text: 'Sent reply: Office use er jonno amra recommend korchi HP 15 (i5, 16GB, 512GB SSD) — price ৳72,500. Apanar budget janale aro option dite parbo! 💻',
      is_replied: 1,
      is_spam: 0,
      sentiment: 'Positive',
      category: 'product recommendation',
      messenger_dm_sent: 1,
      created_at: 'Nov 03, 2026, 08:37 AM'
    }
  ];

  // Messenger Threads
  tables.messenger_threads = [
    {
      id: 'th-saad',
      customer_name: 'Saad',
      customer_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      customer_phone: '01998048911',
      psid: '4009589675668210',
      page_name: 'Precision Trading BD',
      last_message: 'Hi Saad! Thanks for your comment ...',
      last_message_time: '4d',
      bot_active: 1,
      needs_human: 0,
      order_id: '#ORD-95301',
      order_status: 'Confirmed',
      order_amount: 5930,
      started_from_comment: 'Panjabi price koto? Cl size hobe 3pcs?',
      is_window_closed: 1,
      customer_since: '10/26/2026',
      updated_at: '2026-11-03T06:55:00Z'
    },
    {
      id: 'th-tasmia',
      customer_name: 'Tasmia Akter',
      customer_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      customer_phone: '01987654321',
      psid: '4009589675668211',
      page_name: 'Fashion House BD',
      last_message: 'Panjabi price koto? Cl size hobe 3pcs?',
      last_message_time: '2h',
      bot_active: 0,
      needs_human: 1,
      order_id: '#ORD-95427',
      order_status: 'Pending',
      order_amount: 2480,
      started_from_comment: 'Panjabi price koto? Cl size hobe 3pcs?',
      is_window_closed: 0,
      customer_since: '10/28/2026',
      updated_at: '2026-11-03T09:56:00Z'
    },
    {
      id: 'th-imran',
      customer_name: 'Imran Hossain',
      customer_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      customer_phone: '01678901234',
      psid: '4009589675668212',
      page_name: 'Gadget Zone BD',
      last_message: 'Office use er jonno best laptop konta ...',
      last_message_time: '5h',
      bot_active: 1,
      needs_human: 0,
      order_id: '#LEAD-4421',
      order_status: 'In Discussion',
      order_amount: 72500,
      started_from_comment: 'Office use er jonno best laptop konta suggest korben?',
      is_window_closed: 0,
      customer_since: '11/01/2026',
      updated_at: '2026-11-03T08:37:00Z'
    },
    {
      id: 'th-nusrat',
      customer_name: 'Nusrat Jahan',
      customer_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      customer_phone: '01823456789',
      psid: '4009589675668213',
      page_name: 'Precision Trading BD',
      last_message: 'এটা কি কালো রঙে আছে?',
      last_message_time: '6h',
      bot_active: 1,
      needs_human: 0,
      order_id: '#ORD-95410',
      order_status: 'Processing',
      order_amount: 1650,
      started_from_comment: 'এটা কি কালো রঙে আছে?',
      is_window_closed: 0,
      customer_since: '10/20/2026',
      updated_at: '2026-11-03T07:15:00Z'
    },
    {
      id: 'th-rafiul',
      customer_name: 'Rafiul Hasan',
      customer_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      customer_phone: '01712345678',
      psid: '4009589675668214',
      page_name: 'Precision Trading BD',
      last_message: 'Delivery Dhaka te koto din e pabo?',
      last_message_time: '8h',
      bot_active: 1,
      needs_human: 0,
      order_id: '#ORD-95398',
      order_status: 'Delivered',
      order_amount: 1990,
      started_from_comment: 'Delivery Dhaka te koto din e pabo?',
      is_window_closed: 0,
      customer_since: '09/15/2026',
      updated_at: '2026-11-03T05:20:00Z'
    },
    {
      id: 'th-arifur',
      customer_name: 'Arifur Rahman',
      customer_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      customer_phone: '01765432109',
      psid: '4009589675668215',
      page_name: 'Precision Trading BD',
      last_message: 'Bulk order korte চাই, discount পাবো?',
      last_message_time: '10h',
      bot_active: 0,
      needs_human: 1,
      order_id: '#B2B-1187',
      order_status: 'Reviewing',
      order_amount: 25000,
      started_from_comment: 'Bulk order korte chai, discount pabo?',
      is_window_closed: 0,
      customer_since: '11/02/2026',
      updated_at: '2026-11-03T03:10:00Z'
    }
  ];

  // Messenger Messages for Saad
  tables.messenger_messages = [
    {
      id: 'msg-1',
      thread_id: 'th-saad',
      sender: 'bot',
      text: "Hi Saad! 👋 Thanks for your comment on our post. Tell me which product, size/colour and quantity you'd like and I'll get your order ready right here.",
      message_type: 'text',
      payload_json: null,
      created_at: '5:13 PM'
    },
    {
      id: 'msg-2',
      thread_id: 'th-saad',
      sender: 'customer',
      text: 'Ami Panjabi Eid collection 3 pieces size L nite chai. Address: house 22, apt#3B, north badda, dhaka. Phone: 01998048911',
      message_type: 'text',
      payload_json: null,
      created_at: '6:50 AM'
    },
    {
      id: 'msg-3',
      thread_id: 'th-saad',
      sender: 'bot',
      text: 'Order review card',
      message_type: 'order_card',
      payload_json: JSON.stringify({
        subtotal: 5850,
        delivery_fee: 80,
        total: 5930,
        name: 'Saad',
        phone: '01998048911',
        address: 'house 22, apt#3B, north badda, dhaka'
      }),
      created_at: '6:55 AM'
    },
    {
      id: 'msg-4',
      thread_id: 'th-saad',
      sender: 'customer',
      text: '✓ Confirm',
      message_type: 'text',
      payload_json: null,
      created_at: '6:55 AM'
    },
    {
      id: 'msg-5',
      thread_id: 'th-saad',
      sender: 'bot',
      text: 'Order #ORD-95301 created by AI — ৳5,930 COD · 6:55 AM',
      message_type: 'order_confirmation',
      payload_json: JSON.stringify({
        order_id: '#ORD-95301',
        total: 5930
      }),
      created_at: '6:55 AM'
    },
    {
      id: 'msg-6',
      thread_id: 'th-saad',
      sender: 'bot',
      text: '✅ Your order #ORD-95301 has been placed! Total ৳5,930 — pay cash on delivery. Expected delivery: 24-48 hours. Thank you for shopping with us 🙏',
      message_type: 'text',
      payload_json: null,
      created_at: '6:55 AM'
    }
  ];

  // Subscription
  tables.subscription = [
    {
      id: 1,
      plan_name: 'Pro Plan',
      status: 'Active',
      started_date: '01 Oct 2026',
      expires_date: '01 Feb 2027',
      remaining_days: 68,
      connected_pages: 3,
      max_pages: 5,
      ai_replies_count: 12430
    }
  ];

  // Payments
  tables.payments = [
    { id: 'pay-1', date: '01 Oct 2026', plan: 'Pro Plan (1 Month)', amount: 2999, method: 'bKash', reference: '8K7H2D4F9M', status: 'Paid', invoice_url: '#' },
    { id: 'pay-2', date: '01 Sep 2026', plan: 'Pro Plan (1 Month)', amount: 2999, method: 'Nagad', reference: 'NGD65P8K3T', status: 'Paid', invoice_url: '#' },
    { id: 'pay-3', date: '01 Aug 2026', plan: 'Pro Plan (1 Month)', amount: 2999, method: 'bKash', reference: 'BK8G7L2N0Q', status: 'Paid', invoice_url: '#' },
    { id: 'pay-4', date: '01 Jul 2026', plan: 'Starter Plan (1 Month)', amount: 999, method: 'Bank Transfer', reference: 'TRF00123456', status: 'Paid', invoice_url: '#' }
  ];

  // Notifications
  tables.notifications = [
    {
      id: 'notif-1',
      type: 'success',
      title: 'Your Pro Plan has been activated.',
      message: 'You can now use up to 5 Facebook Pages and unlimited AI replies.',
      created_at: '01 Oct 2026, 10:24 AM'
    },
    {
      id: 'notif-2',
      type: 'warning',
      title: 'Your subscription will expire in 68 days.',
      message: 'Renew now to keep your AI agent running without interruption.',
      created_at: '25 Nov 2026, 09:00 AM'
    },
    {
      id: 'notif-3',
      type: 'info',
      title: 'New feature: Advanced Fraud Shield is now available.',
      message: 'Detect and block risky orders with higher accuracy.',
      created_at: '20 Nov 2026, 03:15 PM'
    }
  ];

  // n8n Webhooks
  tables.n8n_webhooks = [
    {
      id: 'wh-1',
      name: 'n8n Order Sync Workflow',
      event: 'order.created',
      target_url: 'http://localhost:5678/webhook/order-created',
      is_active: 1,
      secret: 'n8n_secret_token_123',
      created_at: '2026-11-01T10:00:00Z'
    },
    {
      id: 'wh-2',
      name: 'n8n High Risk Telegram Alert',
      event: 'fraud.flagged',
      target_url: 'http://localhost:5678/webhook/fraud-alert',
      is_active: 1,
      secret: 'n8n_secret_token_456',
      created_at: '2026-11-01T10:05:00Z'
    }
  ];

  tables.n8n_logs = [];

  saveToDisk();
  console.log('✅ Initial seed data populated successfully!');
}

if (!loadFromDisk()) {
  seedData();
}

module.exports = {
  prepare,
  exec
};
