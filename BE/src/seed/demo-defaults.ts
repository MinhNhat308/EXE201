/** Credential mặc định khi không khai báo SEED_DEMO_* trong .env — xem TAI-KHOAN-DEMO.txt ở root repo */
export const DEMO_SEED_DEFAULTS = {
  solo: {
    email: 'demo-solo@bobapos.test',
    password: 'Demo@123',
    name: 'Chủ Solo Demo',
    storeName: 'BOBAPOS Solo Demo',
  },
  store: {
    email: 'demo-store@bobapos.test',
    password: 'Demo@123',
    name: 'Chủ Store Demo',
    storeName: 'BOBAPOS Store Demo',
  },
  chain: {
    email: 'demo-chain@bobapos.test',
    password: 'Demo@123',
    name: 'Chủ Chain Demo',
    storeName: 'BOBAPOS Chain Demo',
  },
} as const;
