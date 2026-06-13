# Autonomous Campaign Planner — AI-Native Mini CRM
**Xeno SDE Internship Submission**

This repository contains the complete implementation of the "Autonomous Campaign Planner" — an AI-native Mini CRM built for the Xeno engineering assignment.

## 🏗️ Architecture Overview

The system is designed with a microservices architecture to handle scale and simulate real-world asynchronous communication flows.

1. **Frontend (Next.js 15, App Router)**: A polished, AI-first dashboard built with React Query and Tailwind CSS.
2. **CRM Backend (Node.js/Express)**: The core API handling customer data, AI interactions, and campaign management.
3. **Channel Service (Node.js/Express)**: A completely separate microservice simulating realistic messaging channels (WhatsApp, SMS, Email, RCS) with probabilistic delivery delays and failures.
4. **Queue Layer (BullMQ + Redis)**: Handles asynchronous job processing for communication sends (with concurrency=10, rate-limiting 50/sec) and webhook receipt processing (concurrency=20, rate-limiting 100/sec). Failed jobs retry with exponential backoff and are eventually moved to a Dead Letter Queue.
5. **Database (MongoDB + Mongoose)**: Document-based data model with proper indexes (city, totalSpent, lastPurchaseDate, channel, status) and an append-only event log with unique `idempotencyKey` for audits.
6. **AI Engine (Groq/Llama 3.3)**: Natural language processing for autonomous audience building, campaign generation, and post-campaign insights.

---

## 🚀 Key Differentiators Built

1. **The Autonomous Campaign Agent**: Instead of clicking through 5 different screens, marketers type a single goal (e.g., "Win back dormant customers in Delhi"). The AI automatically queries the database, creates the optimal audience segment, chooses the best channel, crafts the message, and predicts performance metrics — ready for 1-click approval.
2. **Probabilistic Channel Simulator**: The stubbed Channel Service uses real-world probability models. E.g., WhatsApp has a 92% delivery rate and 72% open rate, with realistic random delays between the `SENT`, `DELIVERED`, and `READ` webhooks.
3. **Idempotent, Queue-Driven Callbacks**: The system uses BullMQ workers backed by Redis for reliable async processing. Idempotency is enforced atomically — the receipt worker attempts a `create()` on the event log and catches MongoDB duplicate key errors (code 11000) from the unique `idempotencyKey` index, eliminating race conditions between concurrent webhooks.
4. **Append-Only Event Log**: Every communication event is logged immutably in the `CommunicationEvent` collection, enabling complex funnel analytics and auditability.

---

## 💻 How to Run Locally

You need **MongoDB** and **Redis** running locally or via cloud providers (MongoDB Atlas / Upstash Redis).

### 1. Database Setup
```bash
cd backend
cp .env.example .env 
# Add your MONGODB_URI, REDIS_URL, and GROQ_API_KEY to backend/.env

npm install
```

### 2. Start the Channel Service
```bash
cd channel-service
npm install
npm run dev
# Runs on port 3002
```

### 3. Start the CRM Backend
```bash
cd backend
npm install
npm run dev
# Runs on port 3001
```

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on port 3000
```

Open `http://localhost:3000` and start using the AI Agent!

### 5. Seed Data
Click "Seed 500 Customers & Orders" on the dashboard, or call:
```bash
curl -X POST http://localhost:3001/api/customers/seed -H "Content-Type: application/json" -d '{"count": 500}'
```

---

## 📽️ Demo Walkthrough Script (5-6 Minutes)

**[0:00 - 0:30] Product Intro**
"Hi, I'm excited to present my submission for Xeno. I built the 'Autonomous Campaign Planner'. Traditional CRMs force marketers to manually build segments, write copy, and pick channels. I took an AI-native approach: marketers just declare their business goal, and the AI handles the execution."

**[0:30 - 2:00] Functional Demo**
"Let's look at the dashboard. We have 500 seeded customers. I'll jump straight to the flagship feature: the AI Agent. I'll type 'Bring back high-value dormant customers'. Watch as the AI queries the database, creates a custom audience segment, recommends WhatsApp because of its high open rates, drafts a personalized message, and predicts the funnel metrics. I review it, click 'Approve', and hit 'Launch'."

**[2:00 - 3:00] Technical Architecture & System Design**
"While that runs, let's talk architecture. When I hit launch, the CRM doesn't block. It enqueues jobs in a BullMQ Redis queue. A BullMQ Worker picks them up with concurrency=10 and rate-limiting at 50 sends/sec, then calls a completely separate Channel Service API. The Channel Service simulates real-world conditions using probabilistic models, and fires asynchronous webhooks back to the CRM with randomized delays, simulating SENT, DELIVERED, READ, and PURCHASED events."

**[3:00 - 4:00] Code Walkthrough (Idempotency & Retries)**
"Let's look at the receipt worker code. Because networks fail and webhooks can duplicate, my receipt worker uses an atomic idempotency pattern — it attempts to insert into a MongoDB event log with a unique `idempotencyKey` index. If the insert fails with a duplicate key error (code 11000), the event is silently skipped. This is fully atomic — no race condition between check and write. If the worker itself crashes, BullMQ retries with exponential backoff, eventually moving bad jobs to a Dead Letter Queue."

**[4:00 - 5:00] AI-Native Workflow**
"For the AI workflow, I'm using Groq with Llama 3.3 70B. The backend sends structured prompts and validates the JSON response against Zod schemas, bridging the gap between natural language and deterministic MongoDB filtering. The autonomous agent chains audience generation with campaign generation in a single call."

**[5:00 - 5:30] Analytics & Wrap up**
"Back to the dashboard — we can see the webhooks have populated the analytics funnel in real-time via WebSocket. We can clearly see the drop-off between Delivered and Opened. The system handles high message volumes gracefully because of the decoupled BullMQ architecture with rate limiting. Thanks for watching!"

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React Query, Recharts, Socket.io Client |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Queue | BullMQ, Redis (IORedis) |
| AI | Groq API (Llama 3.3 70B), Zod schema validation |
| Channel Service | Express (separate microservice) |
| Logging | Pino (structured JSON logging) |
| Security | Helmet, express-rate-limit, CORS |
