/** Màu chủ đạo BOBAPOS — #2F80ED, đồng bộ Solo · Store · Chain */

export const BRAND_HEX = '#2F80ED';
export const BRAND_HEX_DARK = '#1B5BB8';
export const BRAND_HEX_HOVER = '#2569c7';

export const BRAND = {
  hex: BRAND_HEX,
  hexDark: BRAND_HEX_DARK,
  hexHover: BRAND_HEX_HOVER,

  /** Nền trang dashboard / marketing */
  pageBg: 'bg-gradient-to-br from-slate-50 via-[#2F80ED]/8 to-slate-100',

  /** Sidebar store / chain admin */
  sidebarBg: 'bg-gradient-to-b from-slate-950 via-[#1e4d8c] to-slate-950',
  sidebar: 'from-slate-950 via-[#1e4d8c] to-slate-950',

  /** Header gradient (auth, trial, KDS) */
  headerGradient: 'from-[#2F80ED] to-[#1B5BB8]',

  /** Top bar POS / Solo / staff hub */
  topBar:
    'border-b border-stone-200/80 bg-white/95 backdrop-blur-md shadow-sm shadow-stone-200/20',

  /** Nút & link chính */
  primary: 'bg-[#2F80ED] hover:bg-[#2569c7]',
  primaryText: 'text-[#2F80ED]',
  primaryRing: 'ring-[#2F80ED]/30 focus:ring-[#2F80ED]',
  primarySoft: 'bg-[#2F80ED]/10 text-[#1a4a8a] border-[#2F80ED]/25',

  /** Form */
  focusBorder: 'focus:border-[#2F80ED] focus:ring-[#2F80ED]/25',
  input:
    'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/20',

  /** Nút tái sử dụng */
  btnPrimary:
    'inline-flex items-center justify-center rounded-xl bg-[#2F80ED] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2F80ED]/20 transition hover:bg-[#2569c7] disabled:cursor-not-allowed disabled:opacity-60',
  btnPrimaryLg:
    'inline-flex w-full items-center justify-center rounded-xl bg-[#2F80ED] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#2F80ED]/20 transition hover:bg-[#2569c7] disabled:opacity-60',
  btnSecondary:
    'inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50',
  btnGhost:
    'inline-flex items-center justify-center rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 sm:text-sm',

  /** Card & bề mặt */
  card: 'rounded-2xl border border-stone-200/80 bg-white shadow-sm',
  cardHover:
    'rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:border-[#2F80ED]/25 hover:shadow-md',

  /** Nav sidebar */
  navActive: 'bg-white/12 text-white shadow-inner',
  navIdle: 'text-white/70 hover:bg-white/[0.06] hover:text-white',
  navIndicator: 'bg-[#5B9FED]',

  /** Hub stat strip (solo / store staff) */
  statStrip:
    'rounded-2xl border border-[#2F80ED]/20 bg-gradient-to-r from-[#2F80ED]/8 via-white to-white px-5 py-4 shadow-sm',

  spinner: 'border-[#2F80ED]/25 border-t-[#2F80ED]',
} as const;

/** Bảng màu marketing — sáng, đa sắc, phù hợp F&B / trà sữa */
export const MARKETING = {
  pageBg:
    'bg-gradient-to-b from-[#FFF8F3] via-[#F4F9FF] to-[#F8F4FF]',
  heroBg:
    'bg-gradient-to-br from-[#FFF0E6] via-[#EBF5FF] via-50% to-[#F3EEFF]',
  footerGradient: 'bg-gradient-to-br from-[#2F80ED] via-[#7C3AED] to-[#FF6B6B]',
  ctaGradient:
    'bg-gradient-to-r from-[#2F80ED] via-[#8B5CF6] to-[#FF8E53]',
  coral: '#FF6B6B',
  peach: '#FF8E53',
  mint: '#10B981',
  sky: '#2F80ED',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  rose: '#F472B6',
} as const;

/** Ảnh món mẫu (public/menu — đồng bộ với BE menu-images.ts) */
export const MENU_IMAGE_BY_NAME: Record<string, string> = {
  'Trà sữa trân châu đường đen': '/menu/tra-sua-tran-chau.jpg',
  'Trà sữa matcha': '/menu/tra-sua-matcha.jpg',
  'Trà sữa oolong': '/menu/tra-sua-oolong.jpg',
  'Trà sữa khoai môn': '/menu/tra-sua-khoai-mon.jpg',
  'Trà đào cam sả': '/menu/tra-dao-cam-sa.jpg',
  'Trà vải': '/menu/tra-vai.jpg',
  'Trà chanh leo': '/menu/tra-chanh-leo.jpg',
  'Hồng trà kem cheese': '/menu/hong-tra-kem-cheese.jpg',
  'Trà xanh kem cheese': '/menu/tra-xanh-kem-cheese.jpg',
  'Cacao sữa': '/menu/cacao-sua.jpg',
  'Cacao đá xay': '/menu/cacao-da-xay.jpg',
  'Cà phê sữa đá': '/menu/ca-phe-sua-da.jpg',
};

export const DEFAULT_MENU_IMAGE = '/menu/tra-sua-tran-chau.jpg';

export const BRAND_LOGO = '/brand/logo.png';
export const BRAND_COVER = '/brand/cover.png';

export function menuImageUrl(name: string, imageUrl?: string): string {
  const raw = imageUrl || MENU_IMAGE_BY_NAME[name] || DEFAULT_MENU_IMAGE;
  if (raw.includes('images.unsplash.com')) {
    return MENU_IMAGE_BY_NAME[name] || DEFAULT_MENU_IMAGE;
  }
  return raw;
}
