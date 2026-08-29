// CineWave Domain Types and Constants

export const STAGES = {
  INTAKE: 'Stage 1 — Intake',
  AVAILABILITY: 'Stage 2 — Availability',
  APPROVAL: 'Stage 3 — Approval',
  EXECUTION: 'Stage 4 — Booking Execution',
};

export const STAGE_KEYS = {
  INTAKE: 'INTAKE',
  AVAILABILITY: 'AVAILABILITY',
  APPROVAL: 'APPROVAL',
  EXECUTION: 'EXECUTION',
};

export const STATUSES = {
  NEW: 'New',
  PENDING_AVAILABILITY: 'Pending-Availability',
  PENDING_APPROVAL: 'Pending-Approval',
  RESOLVED_CONFIRMED: 'Resolved-Confirmed',
  RESOLVED_CANCELLED: 'Resolved-Cancelled',
  RESOLVED_REFUNDED: 'Resolved-Refunded',
};

export const QUEUES = {
  PREMIUM: 'Premium ShowQueue',
  STANDARD: 'Standard ShowQueue',
};

export const SHOW_TYPES = {
  PREMIUM: 'Premium',
  STANDARD: 'Standard',
};

// Indian Multiplex Seating Categories & INR Tier Multipliers
export const SEAT_CATEGORIES = {
  STANDARD: {
    key: 'STANDARD',
    label: 'Classic Standard',
    multiplier: 1.0,
    badge: 'Classic',
  },
  PRIME: {
    key: 'PRIME',
    label: 'Prime Center',
    multiplier: 1.3,
    badge: 'Prime',
  },
  RECLINER: {
    key: 'RECLINER',
    label: 'VIP Recliner Suite',
    multiplier: 2.0,
    badge: 'VIP Recliner',
  },
};

// Food & Beverage Menu Items (Indian Multiplex Staples in INR)
export const FOOD_BEVERAGE_MENU = [
  {
    id: 'FNB-POP-CARAMEL',
    name: 'Golden Caramel Crunch Popcorn',
    category: 'Popcorn',
    portion: 'Large Tub (110g)',
    price: 320,
    calories: '450 kcal',
    tag: 'Bestseller',
    imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-POP-CHEESE',
    name: 'Cheddar Cheese Blast Popcorn',
    category: 'Popcorn',
    portion: 'Large Tub (105g)',
    price: 290,
    calories: '420 kcal',
    tag: 'Popular',
    imageUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-POP-BUTTER',
    name: 'Classic Movie Butter Salted Popcorn',
    category: 'Popcorn',
    portion: 'Regular Tub (90g)',
    price: 240,
    calories: '380 kcal',
    tag: 'Classic',
    imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-NACHOS',
    name: 'Loaded Crispy Nachos with Hot Cheese & Salsa',
    category: 'Snacks',
    portion: 'Platter (150g)',
    price: 280,
    calories: '490 kcal',
    tag: 'Chef Special',
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-COMBO-MEGA',
    name: 'Multiplex Blockbuster Tub Combo',
    category: 'Combos',
    portion: '1 Large Popcorn + 2 Fountain Pepsis',
    price: 490,
    calories: '680 kcal',
    tag: 'Save ₹120',
    imageUrl: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'FNB-BEV-COFFEE',
    name: 'Signature Cold Brew Hazelnut Coffee',
    category: 'Beverages',
    portion: '350ml Cup',
    price: 220,
    calories: '180 kcal',
    tag: 'Chilled',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80',
  },
];

// Location Hierarchy (State -> City -> Theatres)
export const LOCATIONS = [
  {
    state: 'Telangana',
    cities: [
      {
        city: 'Hyderabad',
        theatres: [
          'Prasads Multiplex IMAX',
          'AMB Cinemas: Gachibowli',
          'PVR Inorbit Mall: Screen 4',
        ],
      },
    ],
  },
  {
    state: 'Maharashtra',
    cities: [
      {
        city: 'Mumbai',
        theatres: [
          'PVR Maison INOX: BKC Luxe',
          'Carnival Cinemas: IMAX Wadala',
          'PVR ICON: Infiniti Andheri',
        ],
      },
    ],
  },
  {
    state: 'Karnataka',
    cities: [
      {
        city: 'Bengaluru',
        theatres: [
          'PVR Superplex: Vega City IMAX',
          'INOX Megaplex: Nexus Koramangala',
          'Cinepolis: Forum South Bengaluru',
        ],
      },
    ],
  },
  {
    state: 'Delhi NCR',
    cities: [
      {
        city: 'New Delhi',
        theatres: [
          'PVR Director’s Cut: Ambience Vasant Kunj',
          'INOX Laserplex: Nehru Place',
          'PVR Plaza: Connaught Place',
        ],
      },
    ],
  },
];

// SLA Durations (in hours)
export const SLA_GOAL_HOURS = 24; // 1 day
export const SLA_DEADLINE_HOURS = 48; // 2 days
