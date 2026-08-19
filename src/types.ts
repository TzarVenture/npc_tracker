/* types.ts: Shared TypeScript interfaces for the tracker data models. */

export interface OfferEvent {
  eventName: string;
  payout: number;
  revenue: number;
}

export interface TrackingUrlItem {
  id: string;
  name: string;
  url: string;
  weight: number; // 0 to 100
  geoTargeting?: string[];
  deviceType?: 'All' | 'Mobile' | 'Desktop';
  status: 'active' | 'paused';
}

/** Weighted page targeting rule — mirrors TrackingUrlItem but for client-side pixel page selection. */
export interface TargetPageRule {
  id: string;
  path: string;                                   // URL path pattern e.g. "/checkout"
  weight: number;                                 // 0-100 percentage weight
  delayMs: number;                                // per-rule delay override (ms)
  matchType: 'exact' | 'contains' | 'startsWith'; // how to compare window.location.pathname
  status: 'active' | 'paused';
}

export interface Offer {
  _id: string;
  name: string;
  destinationUrl: string;
  fallbackUrl: string;
  payout: number;
  revenue: number;
  geoTargeting: string[];
  cityTargeting?: string[];
  deviceType: 'All' | 'Mobile' | 'Desktop';
  osType: 'All' | 'iOS' | 'Android' | 'Windows';
  browserTargeting?: string[];
  ispTargeting?: string[];
  dailyCap: number;
  hourlyCap?: number;
  startDate?: string;
  endDate?: string;
  duplicateWindowMinutes?: number;
  events?: OfferEvent[];
  actionOnFilter: 'redirect' | 'block' | 'log' | 'drop';
  blockBots: boolean;
  triggerDelayMs?: number;
  triggerIntervalMs?: number;
  triggerRepeatCount?: number;
  frequencyCap?: 'unlimited' | 'once_per_session' | 'once_per_user';
  targetPages?: string[];
  // New features: Session check, Multiple Tracking URLs, Redirect & Referrer Hiding
  sessionCheckEnabled?: boolean;
  sessionTtlMinutes?: number;
  trackingUrls?: TrackingUrlItem[];
  redirectType?: '302' | '307' | 'meta' | 'double_meta' | 'custom_referrer';
  customReferrerUrl?: string;
  targetPageRules?: TargetPageRule[];             // weighted page targeting rules
  status: 'active' | 'paused';
  clickCount: number;
  totalConversions?: number;
  conversionRate?: number;
  createdAt: string;
}

export interface Conversion {
  _id: string;
  clickId: string;
  offerId: string;
  pubId?: string;
  subId1?: string;
  subId2?: string;
  eventName?: string;
  revenue: number;
  payout: number;
  timestamp: string;
}

export interface Click {
  _id: string;
  offerId: string;
  sessionId?: string;
  pubId?: string;
  subId1?: string;
  subId2?: string;
  ip: string;
  country: string;
  city?: string;
  device: string;
  os: string;
  browser?: string;
  isp?: string;
  userAgent: string;
  status: 'passed' | 'filtered' | 'capped' | 'blocked';
  filterReason?: string;
  revenue: number;
  timestamp: string;
}

export interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  totalClicks: number;
  totalConversions?: number;
  conversionRate?: number;
  filteredTraffic: number;
  passedTraffic: number;
  totalRevenue: number;
}

export interface User {
  id: string;
  username: string;
  role: 'admin';
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
