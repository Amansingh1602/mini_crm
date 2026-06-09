# Autonomous Campaign Planner — AI-Native Mini CRM
**Xeno SDE Internship Submission**

This repository contains the complete implementation of the "Autonomous Campaign Planner" — an AI-native Mini CRM built for the Xeno engineering assignment.

## 🏗️ Architecture Overview

The system is designed with a microservices architecture to handle scale and simulate real-world asynchronous communication flows.

1. **Frontend (Next.js 15, App Router)**: A polished, AI-first dashboard built with React Query and Tailwind CSS.
2. **CRM Backend (Node.js/Express)**: The core API handling customer data, AI interactions, and campaign management.
3. **Channel Service (Node.js/Express)**: A completely separate microservice simulating realistic messaging channels (WhatsApp, SMS, Email, RCS) with probabilistic delivery delays and failures.
4. **Queue Layer (BullMQ + Redis)**: Handles asynchronous job processing, retries, and idempotency for communication sends and webhook callbacks.
5. **Database (PostgreSQL + Prisma)**: Relational data model optimized with appropriate indexes and an append-only event log for audits.
6. **AI Engine (OpenAI)**: `gpt-4o-mini` powered natural language processing for audience building, campaign generation, and insights.

---

## 🚀 Key Differentiators Built

1. **The Autonomous Campaign Agent**: Instead of clicking through 5 different screens, marketers type a single goal (e.g., "Win back dormant customers in Delhi"). The AI automatically queries the database, creates the optimal audience segment, chooses the best channel, crafts the message, and predicts performance metrics — ready for 1-click approval.
2. **Probabilistic Channel Simulator**: The stubbed Channel Service uses real-world probability models. E.g., WhatsApp has a 92% delivery rate and 72% open rate, with realistic random delays between the `SENT`, `DELIVERED`, and `READ` webhooks.
3. **Idempotent, Queue-Driven Callbacks**: The system doesn't break if the channel service fires duplicate webhooks. BullMQ handles rate limiting and retries, while `idempotencyKeys` in Postgres ensure accurate analytics.
4. **Append-Only Event Log**: Every communication event is logged immutably, enabling complex funnel analytics and auditability.

---

## 💻 How to Run Locally

You need **PostgreSQL** and **Redis** running locally or via cloud providers (Neon/Upstash).

### 1. Database Setup
```bash
cd backend
cp .env.example .env 
# Add your DATABASE_URL, REDIS_URL, and OPENAI_API_KEY to backend/.env

npx prisma generate
npx prisma db push
tsx prisma/seed.ts  # Seeds 500 customers and 2000+ orders
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

---

## 📽️ Demo Walkthrough Script (5-6 Minutes)

**[0:00 - 0:30] Product Intro**
"Hi, I'm excited to present my submission for Xeno. I built the 'Autonomous Campaign Planner'. Traditional CRMs force marketers to manually build segments, write copy, and pick channels. I took an AI-native approach: marketers just declare their business goal, and the AI handles the execution."

**[0:30 - 2:00] Functional Demo**
"Let's look at the dashboard. We have 500 seeded customers. I'll jump straight to the flagship feature: the AI Agent. I'll type 'Bring back high-value dormant customers'. Watch as the AI queries the database, creates a custom audience segment, recommends WhatsApp because of its high open rates, drafts a personalized message, and predicts the funnel metrics. I review it, click 'Approve', and hit 'Launch'."

**[2:00 - 3:00] Technical Architecture & System Design**
"While that runs, let's talk architecture. When I hit launch, the CRM doesn't block. It enqueues jobs in a BullMQ Redis queue. A worker picks them up and calls a completely separate Channel Service API. I built the Channel Service to simulate real-world conditions — it uses probabilistic models to trigger asynchronous webhooks back to the CRM with randomized delays, simulating SENT, DELIVERED, READ, and PURCHASED events."

**[3:00 - 4:00] Code Walkthrough (Idempotency & Retries)**
"Let's look at the webhook receiver code. Because networks fail and webhooks can duplicate, my receipt worker checks a unique `idempotencyKey` against an append-only event log in Postgres before processing. If the database locks or fails, BullMQ automatically retries with exponential backoff, eventually moving bad jobs to a Dead Letter Queue. This ensures analytics are perfectly accurate at scale."

**[4:00 - 5:00] AI-Native Workflow**
"For the AI development workflow, I heavily utilized LLMs for architecture planning and rapid prototyping. I wrote specific prompt instructions to generate the Prisma schema with proper indexing, and used structured JSON outputs from the OpenAI SDK to bridge the gap between natural language and deterministic SQL filtering."

**[5:00 - 5:30] Analytics & Wrap up**
"Back to the dashboard — we can see the webhooks have populated the analytics funnel in real-time. We can clearly see the drop-off between Delivered and Opened. The system handles 100k+ messages gracefully because of the decoupled queue architecture. Thanks for watching!"
