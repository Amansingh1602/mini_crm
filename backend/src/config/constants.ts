export const CHANNELS = {
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  RCS: 'RCS',
} as const;

export type Channel = typeof CHANNELS[keyof typeof CHANNELS];

export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
} as const;

export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];

export const COMMUNICATION_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  OPENED: 'OPENED',
  READ: 'READ',
  CLICKED: 'CLICKED',
  PURCHASED: 'PURCHASED',
} as const;

export type CommunicationStatus = typeof COMMUNICATION_STATUS[keyof typeof COMMUNICATION_STATUS];
