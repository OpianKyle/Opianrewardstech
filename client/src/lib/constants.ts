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
    lump_sum: 1200000,
    monthly_12: 100000,
    monthly_24: 50000
  },
  innovator: {
    lump_sum: 2400000, 
    monthly_12: 200000,
    monthly_24: 100000
  },
  visionary: {
    lump_sum: 3600000,
    monthly_12: 300000, 
    monthly_24: 150000
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
