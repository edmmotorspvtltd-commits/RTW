// ============================================
// CONFIG - MODIFIED (SO_NO REMOVED)
// ============================================

const CONFIG = {
  SHEETS: {
    FORM: 'ENQUIRY_FORM',
    PENDING: 'PENDING_DATA',
    PENDING_APPROVED: 'PENDING_APPROVED',
    CONFIRMED: 'ORDER_CONFIRM_DATA',
    CLOSED: 'ENQUIRY_CLOSED_DATA',
    MASTER: 'MASTER_DATA',
    DASHBOARD: 'DASHBOARD',
    SEARCH_DASHBOARD: 'SEARCH_DASHBOARD',
    REPORTS: 'REPORTS',
    SETTINGS: 'SETTINGS',
    PERFORMANCE: 'PERFORMANCE_ANALYTICS'
  },
  
  CELLS: {
    ENTRY_TYPE: 'B3',
    SEARCH_RTWE: 'B4',
    SELECT_PENDING_APPROVED: 'B5',
    SELECT_EDIT: 'B6',
    RTWE_NO: 'B8',
    COSTING_NO: 'B9',
    ENQ_DATE: 'B10',
    ENQ_TIME: 'B11',
    BROKER: 'B12',
    QUALITY: 'B13',
    GIVEN_RATE: 'B14',
    ORDER_STATUS: 'B15',
    
    APPROVED_DATE: 'B19',
    APPROVED_TIME: 'B20',
    FINAL_RATE: 'B21',
    BUYER: 'B22',
    PO_NO: 'B23',
    // SO_NO: 'B24', ❌ REMOVED
    QUALITY_ORDER: 'B25',
    
    DESIGN1: 'B26',
    TAGA1: 'C26',
    DESIGN2: 'B27',
    TAGA2: 'C27',
    DESIGN3: 'B28',
    TAGA3: 'C28',
    DESIGN4: 'B29',
    TAGA4: 'C29',
    DESIGN5: 'B30',
    TAGA5: 'C30',
    DESIGN6: 'B31',
    TAGA6: 'C31',
    
    TOTAL_ORDER_TAGA: 'B32',
    COUNT_METER: 'B33',
    TOTAL_MTR: 'B34',
    TOTAL_ORDER_VALUE: 'B35',
    SELVEDGE_NAME: 'B36',
    SELVEDGE_ENDS: 'B37',
    SELVEDGE_COLOR: 'B38',
    YARN_USED: 'B39',
    SIZING_BEAM: 'B40',
    PAYMENT_TERMS: 'B41',
    DELIVERY_DATE: 'B42',
    REMARK: 'B43'
  },
  
  USERS: {
    OWNER_EMAIL: 'shekhar.jha@ramratantechnoweave.com',
    SECONDARY_EMAIL: 'navin.mundra@ramratantechnoweave.com',
    OWNER_WHATSAPP: '916350095137',
    SECONDARY_WHATSAPP: '917023706150',
    OWNER_NAME: 'Shekhar',
    COMPANY_NAME: 'Ramratan Techno Weave',
    COMPANY_CITY: 'Address: GAT NO 234, W.NO:24, H.NO: 1770/4, NEAR SONAM CAR GAS, SOALGE MALA, SHAHAPUR, ICHALKARNJI 416115, DIST. KOLHAPUR, MAHARASHTRA'
  },
  
  EXTERNAL_SHEET: {
    ID: '1KHZhq-t5g4yrRyupiPGphg1BcVg8BWu8DjaQ1R2SXSY',
    RTWE_COL: 1,
    STATUS_COL: 2
  },
  
  COLORS: {
    GREEN: '#D9EAD3',
    YELLOW: '#FFF9C4',
    RED: '#F4CCCC'
  },
  
  MASTER_SPREADSHEET_ID: '1te3Mk3WeSPCObeaeqtMeICZp-Hwu6MPvk-xjzGtA4Fg'
};

const TWILIO_CONFIG = {
  ACCOUNT_SID: 'YOUR_TWILIO_ACCOUNT_SID',
  AUTH_TOKEN: 'YOUR_TWILIO_AUTH_TOKEN',
  FROM_WHATSAPP: 'whatsapp:+918432858123',
  FROM_VOICE: '+918432858123',
  ENABLED: false,
  WAIT_TIME: 10 * 60 * 1000,
  CONFIRMATION_KEYWORDS: ['ok', 'done', 'yes', 'confirmed', '👍', 'okay', 'received', 'thik', 'theek']
};

const TELEGRAM_CONFIG = {
  BOT_TOKEN: '8398512229:AAGUBN1as8A9SalazravrVMwy7YdG8_JjYo',
  API_URL: 'https://api.telegram.org/bot',
  ENABLED: true,
  CHAT_IDS: {
    'shekhar': '',
    'navin': ''
  }
};

const EMAIL_CONFIG = {
  DAILY: {
    recipients: ['shekhar.jha@ramratantechnoweave.com'],
    subject: 'RTWE Daily Summary - {DATE}',
    time: 20
  },
  WEEKLY: {
    recipients: [
      'shekhar.jha@ramratantechnoweave.com',
      'navinkumar.mundra@ramratantechnoweave.com'
    ],
    subject: 'RTWE Weekly Report - Week {WEEK}',
    day: 1,
    time: 20
  },
  MONTHLY: {
    recipients: [
      'shekhar.jha@ramratantechnoweave.com',
      'navinkumar.mundra@ramratantechnoweave.com'
    ],
    subject: 'RTWE Monthly Report - {MONTH} {YEAR}',
    day: 1,
    time: 20
  }
};

const USERS_CONFIG = {
  users: {
    'admin': {
      password: 'admin123',
      name: 'Shekhar (Owner)',
      role: 'OWNER',
      email: 'shekhar.jha@ramratantechnoweave.com',
      phone: '6350095137',
      access: ['ALL']
    },
    'manager': {
      password: 'manager123',
      name: 'Manager',
      role: 'MANAGER',
      email: '',
      phone: '',
      access: ['VIEW_ALL', 'APPROVE', 'REPORTS', 'DASHBOARD']
    },
    'assistant': {
      password: 'assistant123',
      name: 'Assistant Manager',
      role: 'ASSISTANT_MANAGER',
      email: '',
      phone: '',
      access: ['ENTRY', 'EDIT', 'VIEW_ALL']
    },
    'team1': {
      password: 'team123',
      name: 'Team Member 1',
      role: 'TEAM_MEMBER',
      email: '',
      phone: '',
      access: ['ENTRY', 'VIEW_OWN']
    },
    'team2': {
      password: 'team123',
      name: 'Team Member 2',
      role: 'TEAM_MEMBER',
      email: '',
      phone: '',
      access: ['ENTRY', 'VIEW_OWN']
    }
  },
  
  security: {
    maxLoginAttempts: 3,
    sessionTimeout: 15,
    lockoutDuration: 30,
    passwordMinLength: 6
  }
};