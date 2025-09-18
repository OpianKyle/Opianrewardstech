export const TIER_TYPES = {
  BUILDER: 'builder',
  INNOVATOR: 'innovator', 
  VISIONARY: 'visionary'
} as const;

export const PAYMENT_METHODS = {
  LUMP_SUM: 'lump_sum',
  MONTHLY_12: 'monthly_12',
  MONTHLY_24: 'monthly_24'
} as const;

export const TIER_PRICING = {
  builder: {
    lump_sum: 12000,
    monthly_12: 1000,
    monthly_24: 500
  },
  innovator: {
    lump_sum: 24000, 
    monthly_12: 2000,
    monthly_24: 1000
  },
  visionary: {
    lump_sum: 36000,
    monthly_12: 3000, 
    monthly_24: 1500
  }
} as const;

export const QUEST_MILESTONES = {
  LEVEL_1: {
    title: "CAPITAL RECLAIMED",
    description: "You receive a one-time payload equal to your initial investment",
    timeframe: "Month 36"
  },
  LEVEL_2: {
    title: "VICTORY LAP", 
    description: "Annual dividends for 10 years (45% annual return)",
    timeframe: "Years 4 - 13"
  }
} as const;
