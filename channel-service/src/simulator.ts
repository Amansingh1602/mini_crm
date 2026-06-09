import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { config } from './config';

const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: config.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
    : undefined,
  base: { service: 'xeno-channel' },
});

// ─── Types ────────────────────────────────────────────────

interface SendRequest {
  communicationId: string;
  campaignId: string;
  customerId: string;
  channel: string;
  message: string;
  recipient: {
    email?: string;
    phone?: string;
    name?: string;
  };
  callbackUrl?: string;
}

type EventType = 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED' | 'READ' | 'CLICKED' | 'PURCHASED';

// ─── Channel-Specific Probability Configs ─────────────────
// Realistic probability models per channel

interface ChannelConfig {
  deliveryRate: number;    // P(DELIVERED | SENT)
  failureRate: number;     // P(FAILED | SENT)
  openRate: number;        // P(OPENED | DELIVERED)
  readRate: number;        // P(READ | OPENED)
  clickRate: number;       // P(CLICKED | READ)
  purchaseRate: number;    // P(PURCHASED | CLICKED)
  delays: {                // Delay ranges in ms for each event
    sent: [number, number];
    delivered: [number, number];
    opened: [number, number];
    read: [number, number];
    clicked: [number, number];
    purchased: [number, number];
  };
}

const CHANNEL_CONFIGS: Record<string, ChannelConfig> = {
  WHATSAPP: {
    deliveryRate: 0.92,
    failureRate: 0.08,
    openRate: 0.72,
    readRate: 0.85,
    clickRate: 0.18,
    purchaseRate: 0.12,
    delays: {
      sent: [100, 500],
      delivered: [1000, 5000],
      opened: [5000, 30000],
      read: [2000, 15000],
      clicked: [3000, 20000],
      purchased: [10000, 60000],
    },
  },
  SMS: {
    deliveryRate: 0.95,
    failureRate: 0.05,
    openRate: 0.45,
    readRate: 0.90,
    clickRate: 0.08,
    purchaseRate: 0.10,
    delays: {
      sent: [100, 300],
      delivered: [500, 3000],
      opened: [3000, 20000],
      read: [1000, 10000],
      clicked: [5000, 25000],
      purchased: [15000, 90000],
    },
  },
  EMAIL: {
    deliveryRate: 0.85,
    failureRate: 0.15,
    openRate: 0.25,
    readRate: 0.70,
    clickRate: 0.05,
    purchaseRate: 0.08,
    delays: {
      sent: [200, 1000],
      delivered: [2000, 10000],
      opened: [10000, 60000],
      read: [5000, 30000],
      clicked: [10000, 45000],
      purchased: [20000, 120000],
    },
  },
  RCS: {
    deliveryRate: 0.88,
    failureRate: 0.12,
    openRate: 0.60,
    readRate: 0.80,
    clickRate: 0.12,
    purchaseRate: 0.10,
    delays: {
      sent: [100, 500],
      delivered: [1000, 5000],
      opened: [5000, 25000],
      read: [2000, 12000],
      clicked: [4000, 22000],
      purchased: [12000, 75000],
    },
  },
};

// ─── Utility Functions ────────────────────────────────────

function randomDelay(range: [number, number]): number {
  return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
}

function shouldOccur(probability: number): boolean {
  return Math.random() < probability;
}

// ─── Callback Sender ─────────────────────────────────────

async function sendCallback(
  callbackUrl: string,
  communicationId: string,
  campaignId: string,
  eventType: EventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  const payload = {
    communicationId,
    campaignId,
    type: eventType,
    timestamp: new Date().toISOString(),
    idempotencyKey: `${communicationId}-${eventType}-${uuidv4().slice(0, 8)}`,
    metadata,
  };

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await axios.post(callbackUrl, payload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      });
      logger.info({ communicationId, eventType, attempt }, 'Callback sent successfully');
      return;
    } catch (err: any) {
      logger.warn(
        { communicationId, eventType, attempt, error: err.message },
        'Callback failed, retrying...'
      );
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // Linear backoff
      }
    }
  }
  logger.error({ communicationId, eventType }, 'Callback failed after all retries');
}

// ─── Delivery Simulator ──────────────────────────────────
// Simulates the full lifecycle of a communication asynchronously

export async function simulateDelivery(request: SendRequest): Promise<void> {
  const channel = request.channel.toUpperCase();
  const channelConfig = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.WHATSAPP;
  const callbackUrl = request.callbackUrl || config.CRM_CALLBACK_URL;

  logger.info(
    { communicationId: request.communicationId, channel, recipient: request.recipient.name },
    'Starting delivery simulation'
  );

  // Run simulation asynchronously — don't block the response
  (async () => {
    try {
      // Step 1: SENT (always happens first)
      await new Promise((r) => setTimeout(r, randomDelay(channelConfig.delays.sent)));
      await sendCallback(callbackUrl, request.communicationId, request.campaignId, 'SENT');

      // Step 2: DELIVERED or FAILED
      await new Promise((r) => setTimeout(r, randomDelay(channelConfig.delays.delivered)));

      if (shouldOccur(channelConfig.failureRate)) {
        await sendCallback(callbackUrl, request.communicationId, request.campaignId, 'FAILED', {
          reason: getRandomFailureReason(channel),
        });
        return; // Stop here — message failed
      }

      await sendCallback(callbackUrl, request.communicationId, request.campaignId, 'DELIVERED');

      // Step 3: OPENED
      if (!shouldOccur(channelConfig.openRate)) return;
      await new Promise((r) => setTimeout(r, randomDelay(channelConfig.delays.opened)));
      await sendCallback(callbackUrl, request.communicationId, request.campaignId, 'OPENED');

      // Step 4: READ
      if (!shouldOccur(channelConfig.readRate)) return;
      await new Promise((r) => setTimeout(r, randomDelay(channelConfig.delays.read)));
      await sendCallback(callbackUrl, request.communicationId, request.campaignId, 'READ');

      // Step 5: CLICKED
      if (!shouldOccur(channelConfig.clickRate)) return;
      await new Promise((r) => setTimeout(r, randomDelay(channelConfig.delays.clicked)));
      await sendCallback(callbackUrl, request.communicationId, request.campaignId, 'CLICKED');

      // Step 6: PURCHASED
      if (!shouldOccur(channelConfig.purchaseRate)) return;
      await new Promise((r) => setTimeout(r, randomDelay(channelConfig.delays.purchased)));
      const orderAmount = Math.round((Math.random() * 5000 + 500) * 100) / 100;
      await sendCallback(callbackUrl, request.communicationId, request.campaignId, 'PURCHASED', {
        orderAmount,
        currency: 'INR',
      });

      logger.info({ communicationId: request.communicationId }, 'Full lifecycle simulation complete');
    } catch (err) {
      logger.error({ err, communicationId: request.communicationId }, 'Simulation error');
    }
  })();
}

function getRandomFailureReason(channel: string): string {
  const reasons: Record<string, string[]> = {
    WHATSAPP: ['User not on WhatsApp', 'Number blocked', 'Rate limit exceeded', 'Template rejected'],
    SMS: ['Invalid number', 'DND registered', 'Network error', 'Carrier rejection'],
    EMAIL: ['Bounced', 'Spam filtered', 'Invalid address', 'Mailbox full'],
    RCS: ['RCS not supported', 'Fallback required', 'Network error', 'Device offline'],
  };
  const channelReasons = reasons[channel] || reasons.WHATSAPP;
  return channelReasons[Math.floor(Math.random() * channelReasons.length)];
}
