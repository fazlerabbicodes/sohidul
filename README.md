# CommercePilot AI - Autonomous Social Commerce, CRM & n8n Automation Engine

A full-stack, autonomous Bangladeshi social commerce management platform, replicated from the exact production screens of **CommercePilot AI**, built for automated order processing, Facebook comments auto-reply, Messenger sales chat, inventory synchronization, fraud shield risk scoring, B2B lead discovery, and **n8n workflow automation**.

---

## 📸 Screenshots to Application Pages Mapping

| Screenshot | Route | Title / Feature | Description |
|---|---|---|---|
| **1.png** | `/fraud` | **Fraud Shield** | Rule-based scoring (0-100), held order approvals/rejections, repeat return customer tracking, settings toggles. |
| **2.png** | `/inventory` | **Inventory Management** | Product SKUs, price in ৳, variant sizes/colors, live stock adjusters (`-1`, `+1`, `+10`), website connector. |
| **3.png** | `/subscription` | **Your Subscription** | Pro Plan status, validity progress bar, renewal form with bKash/Nagad/Rocket reference verification, payment history. |
| **4.png** | `/` or `/overview` | **Business Overview** | Workspace banner, 8 KPI metric cards (revenue, AI orders, open threads, B2B leads), live AI orders table. |
| **5.png** | `/leads` | **Lead Discovery & Pipeline** | AI-powered public web discovery by keywords & location, presets (Garments, Textiles, Buying House), CSV export, pipeline status kanban. |
| **6.png, 7.png, 8.png** | `/comments` | **FB Comments Engine** | Autonomous AI comment response & direct message dispatcher, sentiment analysis, simulation engine, Messenger handover. |
| **9.png** | `/inbox` | **Customer Inbox** | 3-column Messenger CRM (threads, chat with automated order draft card and instant `[✓ Confirm]` button, customer profile drawer). |
| **10.png** | `/orders` | **Order Fulfillment** | Live fulfillment status dropdowns, search & status filters, amount splits (Sub + Delivery fee), courier returns. |
| **New Hub** | `/automation` | **n8n Automation Hub** | Webhook manager, test event dispatcher, ready-to-import n8n workflow JSON templates, live activity diagnostics. |

---

## ⚡ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router 6.
- **Backend**: Node.js, Express, REST API, JSON/SQLite Relational Store, Outbound & Inbound Webhooks.
- **Automation**: Ready for **n8n** (Webhook Triggers, Meta Graph Webhook Receiver, Consignment Booking, Telegram/Slack Alerts).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install backend and frontend dependencies
npm run install:all
```

### 2. Run in Production Mode (Unified Single Port)
```bash
# Build the frontend and run Express on port 5000
npm run build
npm start
```
Open your browser at: **`http://localhost:5000`**

### 3. Run in Development Mode (with Hot Reloading)
In two separate terminals:
```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Frontend Vite dev server (Proxied to backend)
npm run dev:frontend
```
Open Vite dev at: **`http://localhost:3000`**

---

## 🤖 n8n Automation Setup

CommercePilot AI is built to connect seamlessly to **n8n** (hosted locally at `http://localhost:5678` or in cloud).

### 1. Outbound Webhooks (CommercePilot -> n8n)
Go to **n8n Automation** (`/automation`) in the dashboard:
1. Enter your n8n Webhook URL (e.g., `http://localhost:5678/webhook/order-created`).
2. Select the event trigger:
   - `order.created`: Fires when a customer places an order via Messenger, Comment, or Dashboard.
   - `order.status_updated`: Fires when order moves to Processing, Packed, Shipped, or Delivered.
   - `fraud.flagged`: Fires when Fraud Shield detects risky orders (repeat returns, multiple phones, etc.).
   - `comment.received`: Fires when Facebook comment is received and auto-replied.
   - `lead.discovered`: Fires when B2B prospects are crawled from the public web.
3. Click **"Send Test Webhook to n8n"** to verify live connectivity with your workflow.

### 2. Inbound Webhooks (n8n -> CommercePilot)
Your n8n workflows can also create and update data in CommercePilot:

- **Create Order**: `POST http://localhost:5000/api/webhooks/n8n/order`
  ```json
  {
    "customer_name": "Rahim Khan",
    "customer_phone": "01711223344",
    "delivery_address": "House 14, Road 2, Dhanmondi, Dhaka",
    "subtotal": 1950,
    "delivery_fee": 80,
    "courier": "SteadFast"
  }
  ```

- **Update Inventory Stock**: `POST http://localhost:5000/api/webhooks/n8n/inventory`
  ```json
  {
    "sku": "PAN-001",
    "delta": -1
  }
  ```

- **Import Scraped Lead**: `POST http://localhost:5000/api/webhooks/n8n/lead`
  ```json
  {
    "business_name": "Apex Knitwear Ltd.",
    "website": "apexknitwear.com",
    "phone": "+880 1712-334455",
    "location": "Gazipur, Bangladesh",
    "category": "Garments & Apparel"
  }
  ```

- **Facebook Webhook Relay**: `POST http://localhost:5000/api/webhooks/facebook`

### 3. Pre-built n8n Workflows
Templates are included in `/n8n-workflows/`:
1. `1_courier_booking_pathao_steadfast.json` - Auto-generates SteadFast courier parcel consignment when order is confirmed.
2. `2_fraud_alert_telegram_whatsapp.json` - Sends immediate Telegram alert on high-risk orders.
3. `3_google_sheets_order_inventory_sync.json` - Appends confirmed orders to Google Sheets.
