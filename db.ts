/* db.ts: Production SQLite database layer using better-sqlite3 with indexing & migration. */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { Offer, Click, Conversion } from "./src/types";

const DB_PATH = path.join(process.cwd(), "tracker.sqlite");
const OLD_DB_JSON = path.join(process.cwd(), "db.json");

// Initialize SQLite database instance
const db = new Database(DB_PATH);

// Enable WAL (Write-Ahead Logging) mode for high performance concurrent reads and writes
db.pragma("journal_mode = WAL");

// Initialize table schemas
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      destination_url TEXT NOT NULL,
      fallback_url TEXT NOT NULL,
      payout REAL NOT NULL DEFAULT 0,
      revenue REAL NOT NULL DEFAULT 0,
      geo_targeting TEXT DEFAULT '[]',
      city_targeting TEXT DEFAULT '[]',
      device_type TEXT DEFAULT 'All',
      os_type TEXT DEFAULT 'All',
      browser_targeting TEXT DEFAULT '[]',
      isp_targeting TEXT DEFAULT '[]',
      daily_cap INTEGER DEFAULT 0,
      hourly_cap INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      duplicate_window_minutes INTEGER DEFAULT 0,
      events TEXT DEFAULT '[]',
      action_on_filter TEXT DEFAULT 'redirect',
      block_bots INTEGER DEFAULT 1,
      trigger_delay_ms INTEGER DEFAULT 0,
      trigger_interval_ms INTEGER DEFAULT 0,
      trigger_repeat_count INTEGER DEFAULT 0,
      frequency_cap TEXT DEFAULT 'unlimited',
      target_pages TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      click_count INTEGER DEFAULT 0,
      total_conversions INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL,
      pub_id TEXT,
      sub_id1 TEXT,
      sub_id2 TEXT,
      ip TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT,
      device TEXT NOT NULL,
      os TEXT NOT NULL,
      browser TEXT,
      isp TEXT,
      user_agent TEXT NOT NULL,
      status TEXT NOT NULL,
      filter_reason TEXT,
      revenue REAL DEFAULT 0,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversions (
      id TEXT PRIMARY KEY,
      click_id TEXT NOT NULL UNIQUE,
      offer_id TEXT NOT NULL,
      pub_id TEXT,
      sub_id1 TEXT,
      sub_id2 TEXT,
      event_name TEXT,
      revenue REAL DEFAULT 0,
      payout REAL DEFAULT 0,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      ip TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS publishers (
      id TEXT PRIMARY KEY,
      pub_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Create performance indexes for real-time tracking lookups
    CREATE INDEX IF NOT EXISTS idx_clicks_offer ON clicks(offer_id);
    CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
    CREATE INDEX IF NOT EXISTS idx_clicks_ip_offer ON clicks(ip, offer_id);
    CREATE INDEX IF NOT EXISTS idx_conversions_click ON conversions(click_id);
    CREATE INDEX IF NOT EXISTS idx_conversions_offer ON conversions(offer_id);
  `);

  // Auto-upgrade schema for new features (Session Check, Tracking URLs, Redirect Types)
  try { db.exec("ALTER TABLE offers ADD COLUMN session_check_enabled INTEGER DEFAULT 0;"); } catch (e) {}
  try { db.exec("ALTER TABLE offers ADD COLUMN session_ttl_minutes INTEGER DEFAULT 1440;"); } catch (e) {}
  try { db.exec("ALTER TABLE offers ADD COLUMN tracking_urls TEXT DEFAULT '[]';"); } catch (e) {}
  try { db.exec("ALTER TABLE offers ADD COLUMN redirect_type TEXT DEFAULT '302';"); } catch (e) {}
  try { db.exec("ALTER TABLE offers ADD COLUMN custom_referrer_url TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE clicks ADD COLUMN session_id TEXT DEFAULT '';"); } catch (e) {}
  try { db.exec("ALTER TABLE offers ADD COLUMN target_page_rules TEXT DEFAULT '[]';"); } catch (e) {}

  // Initialize default Admin User if none exists
  const existingAdmin = db.prepare("SELECT * FROM admin_users WHERE username = ?").get("admin");
  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("usr-admin-1", "admin", passwordHash, "admin", new Date().toISOString());
  }

  // Initialize default system settings
  const existingTracking = db.prepare("SELECT value FROM system_settings WHERE key = ?").get("globalTracking");
  if (!existingTracking) {
    db.prepare("INSERT INTO system_settings (key, value) VALUES (?, ?)").run("globalTracking", "true");
  }

  // Auto-migrate old db.json if present and sqlite tables are empty
  const offerCount = (db.prepare("SELECT COUNT(*) as cnt FROM offers").get() as any).cnt;
  if (offerCount === 0 && fs.existsSync(OLD_DB_JSON)) {
    try {
      const raw = fs.readFileSync(OLD_DB_JSON, "utf-8");
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.offers)) {
        for (const o of parsed.offers) {
          saveOffer({
            _id: o._id,
            name: o.name,
            destinationUrl: o.destinationUrl,
            fallbackUrl: o.fallbackUrl || o.destinationUrl,
            payout: o.payout || 0,
            revenue: o.revenue || 0,
            geoTargeting: o.geoTargeting || [],
            cityTargeting: o.cityTargeting || [],
            deviceType: o.deviceType || "All",
            osType: o.osType || "All",
            browserTargeting: o.browserTargeting || [],
            ispTargeting: o.ispTargeting || [],
            dailyCap: o.dailyCap || 0,
            hourlyCap: o.hourlyCap || 0,
            startDate: o.startDate || undefined,
            endDate: o.endDate || undefined,
            duplicateWindowMinutes: o.duplicateWindowMinutes || 0,
            events: o.events || [],
            actionOnFilter: o.actionOnFilter || "redirect",
            blockBots: o.blockBots !== false,
            triggerDelayMs: o.triggerDelayMs || 0,
            triggerIntervalMs: o.triggerIntervalMs || 0,
            triggerRepeatCount: o.triggerRepeatCount || 0,
            frequencyCap: o.frequencyCap || "unlimited",
            targetPages: o.targetPages || [],
            status: o.status || "active",
            clickCount: o.clickCount || 0,
            totalConversions: o.totalConversions || 0,
            conversionRate: o.conversionRate || 0,
            createdAt: o.createdAt || new Date().toISOString()
          });
        }
      }

      if (Array.isArray(parsed.clicks)) {
        for (const c of parsed.clicks) {
          recordClick({
            _id: c._id,
            offerId: c.offerId,
            pubId: c.pubId || "",
            subId1: c.subId1 || "",
            subId2: c.subId2 || "",
            ip: c.ip || "127.0.0.1",
            country: c.country || "US",
            city: c.city || "Unknown",
            device: c.device || "Desktop",
            os: c.os || "Unknown",
            browser: c.browser || "Unknown",
            isp: c.isp || "Unknown ISP",
            userAgent: c.userAgent || "",
            status: c.status || "passed",
            filterReason: c.filterReason || "",
            revenue: c.revenue || 0,
            timestamp: c.timestamp || new Date().toISOString()
          });
        }
      }

      if (Array.isArray(parsed.conversions)) {
        for (const conv of parsed.conversions) {
          recordConversion({
            _id: conv._id,
            clickId: conv.clickId,
            offerId: conv.offerId,
            pubId: conv.pubId || "",
            subId1: conv.subId1 || "",
            subId2: conv.subId2 || "",
            eventName: conv.eventName || "default",
            revenue: conv.revenue || 0,
            payout: conv.payout || 0,
            timestamp: conv.timestamp || new Date().toISOString()
          });
        }
      }

      if (Array.isArray(parsed.blacklist)) {
        for (const ip of parsed.blacklist) {
          addBlacklistIp(ip);
        }
      }

      if (parsed.globalTracking !== undefined) {
        setGlobalTrackingState(parsed.globalTracking);
      }
    } catch (err) {
      // Ignore migration errors cleanly
    }
  }
}

// Global Tracking Settings
export function getGlobalTrackingState(): boolean {
  const row = db.prepare("SELECT value FROM system_settings WHERE key = ?").get("globalTracking") as any;
  return row ? row.value === "true" : true;
}

export function setGlobalTrackingState(active: boolean): void {
  db.prepare("INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run("globalTracking", active ? "true" : "false");
}

// Offers Database Operations
export function getAllOffers(): Offer[] {
  const rows = db.prepare("SELECT * FROM offers ORDER BY created_at DESC").all() as any[];
  // High-performance single SQL aggregation query to avoid N+1 query overhead
  const passedCounts = db.prepare(`
    SELECT offer_id, COUNT(*) as cnt
    FROM clicks
    WHERE status = 'passed'
    GROUP BY offer_id
  `).all() as any[];
  const passedMap = new Map<string, number>(passedCounts.map(pc => [pc.offer_id, pc.cnt]));

  return rows.map(r => mapOfferRow(r, passedMap.get(r.id) || 0));
}

export function getOfferById(id: string): Offer | undefined {
  const row = db.prepare("SELECT * FROM offers WHERE id = ?").get(id) as any;
  return row ? mapOfferRow(row) : undefined;
}

export function saveOffer(offer: Offer): Offer {
  db.prepare(`
    INSERT INTO offers (
      id, name, destination_url, fallback_url, payout, revenue,
      geo_targeting, city_targeting, device_type, os_type, browser_targeting, isp_targeting,
      daily_cap, hourly_cap, start_date, end_date, duplicate_window_minutes, events,
      action_on_filter, block_bots, trigger_delay_ms, trigger_interval_ms, trigger_repeat_count,
      frequency_cap, target_pages, session_check_enabled, session_ttl_minutes, tracking_urls,
      redirect_type, custom_referrer_url, target_page_rules, status, click_count, total_conversions, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      destination_url = excluded.destination_url,
      fallback_url = excluded.fallback_url,
      payout = excluded.payout,
      revenue = excluded.revenue,
      geo_targeting = excluded.geo_targeting,
      city_targeting = excluded.city_targeting,
      device_type = excluded.device_type,
      os_type = excluded.os_type,
      browser_targeting = excluded.browser_targeting,
      isp_targeting = excluded.isp_targeting,
      daily_cap = excluded.daily_cap,
      hourly_cap = excluded.hourly_cap,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      duplicate_window_minutes = excluded.duplicate_window_minutes,
      events = excluded.events,
      action_on_filter = excluded.action_on_filter,
      block_bots = excluded.block_bots,
      trigger_delay_ms = excluded.trigger_delay_ms,
      trigger_interval_ms = excluded.trigger_interval_ms,
      trigger_repeat_count = excluded.trigger_repeat_count,
      frequency_cap = excluded.frequency_cap,
      target_pages = excluded.target_pages,
      session_check_enabled = excluded.session_check_enabled,
      session_ttl_minutes = excluded.session_ttl_minutes,
      tracking_urls = excluded.tracking_urls,
      redirect_type = excluded.redirect_type,
      custom_referrer_url = excluded.custom_referrer_url,
      target_page_rules = excluded.target_page_rules,
      status = excluded.status,
      click_count = excluded.click_count,
      total_conversions = excluded.total_conversions
  `).run(
    offer._id,
    offer.name,
    offer.destinationUrl,
    offer.fallbackUrl,
    offer.payout,
    offer.revenue,
    JSON.stringify(offer.geoTargeting || []),
    JSON.stringify(offer.cityTargeting || []),
    offer.deviceType || "All",
    offer.osType || "All",
    JSON.stringify(offer.browserTargeting || []),
    JSON.stringify(offer.ispTargeting || []),
    offer.dailyCap || 0,
    offer.hourlyCap || 0,
    offer.startDate || null,
    offer.endDate || null,
    offer.duplicateWindowMinutes || 0,
    JSON.stringify(offer.events || []),
    offer.actionOnFilter || "redirect",
    offer.blockBots ? 1 : 0,
    offer.triggerDelayMs || 0,
    offer.triggerIntervalMs || 0,
    offer.triggerRepeatCount || 0,
    offer.frequencyCap || "unlimited",
    JSON.stringify(offer.targetPages || []),
    offer.sessionCheckEnabled ? 1 : 0,
    offer.sessionTtlMinutes || 1440,
    JSON.stringify(offer.trackingUrls || []),
    offer.redirectType || "302",
    offer.customReferrerUrl || "",
    JSON.stringify(offer.targetPageRules || []),
    offer.status || "active",
    offer.clickCount || 0,
    offer.totalConversions || 0,
    offer.createdAt || new Date().toISOString()
  );

  return getOfferById(offer._id)!;
}

export function deleteOffer(id: string): void {
  db.prepare("DELETE FROM offers WHERE id = ?").run(id);
  db.prepare("DELETE FROM clicks WHERE offer_id = ?").run(id);
  db.prepare("DELETE FROM conversions WHERE offer_id = ?").run(id);
}

export function incrementOfferClickCount(offerId: string): void {
  db.prepare("UPDATE offers SET click_count = click_count + 1 WHERE id = ?").run(offerId);
}

export function incrementOfferConversions(offerId: string): void {
  db.prepare("UPDATE offers SET total_conversions = total_conversions + 1 WHERE id = ?").run(offerId);
}

// Clicks & Conversion Queries
export function recordClick(click: Click): Click {
  db.prepare(`
    INSERT INTO clicks (
      id, offer_id, session_id, pub_id, sub_id1, sub_id2, ip, country, city,
      device, os, browser, isp, user_agent, status, filter_reason, revenue, timestamp
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    click._id,
    click.offerId,
    click.sessionId || "",
    click.pubId || "",
    click.subId1 || "",
    click.subId2 || "",
    click.ip,
    click.country,
    click.city || "Unknown",
    click.device,
    click.os,
    click.browser || "Unknown",
    click.isp || "Unknown ISP",
    click.userAgent,
    click.status,
    click.filterReason || "",
    click.revenue || 0,
    click.timestamp
  );

  return click;
}

export function getClicksPaginated(page = 1, limit = 20, offerId?: string, status?: string, search?: string, startDate?: string, endDate?: string) {
  let whereClauses: string[] = [];
  let params: any[] = [];

  if (offerId && offerId !== "all") {
    whereClauses.push("offer_id = ?");
    params.push(offerId);
  }
  if (status && status !== "all") {
    whereClauses.push("status = ?");
    params.push(status);
  }
  if (search && search.trim()) {
    whereClauses.push("(ip LIKE ? OR pub_id LIKE ? OR sub_id1 LIKE ? OR country LIKE ?)");
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }
  if (startDate && startDate.trim()) {
    whereClauses.push("timestamp >= ?");
    params.push(startDate.trim());
  }
  if (endDate && endDate.trim()) {
    whereClauses.push("timestamp <= ?");
    params.push(endDate.trim());
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const totalRow = db.prepare(`SELECT COUNT(*) as total FROM clicks ${whereSql}`).get(...params) as any;

  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM clicks ${whereSql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as any[];

  return {
    total: totalRow.total,
    page,
    limit,
    data: rows.map(mapClickRow)
  };
}

export function getAllClicksFiltered(offerId?: string, status?: string, search?: string, startDate?: string, endDate?: string): Click[] {
  let whereClauses: string[] = [];
  let params: any[] = [];

  if (offerId && offerId !== "all") {
    whereClauses.push("offer_id = ?");
    params.push(offerId);
  }
  if (status && status !== "all") {
    whereClauses.push("status = ?");
    params.push(status);
  }
  if (search && search.trim()) {
    whereClauses.push("(ip LIKE ? OR pub_id LIKE ? OR sub_id1 LIKE ? OR country LIKE ?)");
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }
  if (startDate && startDate.trim()) {
    whereClauses.push("timestamp >= ?");
    params.push(startDate.trim());
  }
  if (endDate && endDate.trim()) {
    whereClauses.push("timestamp <= ?");
    params.push(endDate.trim());
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";
  const rows = db.prepare(`SELECT * FROM clicks ${whereSql} ORDER BY timestamp DESC`).all(...params) as any[];
  return rows.map(mapClickRow);
}

export function getRecentLiveClicks(limit = 20): Click[] {
  const rows = db.prepare("SELECT * FROM clicks ORDER BY timestamp DESC LIMIT ?").all(limit) as any[];
  return rows.map(mapClickRow);
}

export function getClicksTodayCount(offerId: string): number {
  const today = new Date().toISOString().split("T")[0];
  const row = db.prepare("SELECT COUNT(*) as cnt FROM clicks WHERE offer_id = ? AND timestamp LIKE ?")
    .get(offerId, `${today}%`) as any;
  return row ? row.cnt : 0;
}

export function getClicksHourlyCount(offerId: string): number {
  const currentHourPrefix = new Date().toISOString().substring(0, 13); // e.g. "2026-07-30T11"
  const row = db.prepare("SELECT COUNT(*) as cnt FROM clicks WHERE offer_id = ? AND timestamp LIKE ?")
    .get(offerId, `${currentHourPrefix}%`) as any;
  return row ? row.cnt : 0;
}

export function hasRecentClickFromIp(offerId: string, ip: string, windowMinutes: number): boolean {
  if (windowMinutes <= 0) return false;
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM clicks WHERE offer_id = ? AND ip = ? AND timestamp >= ?")
    .get(offerId, ip, cutoff) as any;
  return row ? row.cnt > 0 : false;
}

// Conversions
export function recordConversion(conv: Conversion): Conversion {
  db.prepare(`
    INSERT INTO conversions (id, click_id, offer_id, pub_id, sub_id1, sub_id2, event_name, revenue, payout, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    conv._id,
    conv.clickId,
    conv.offerId,
    conv.pubId || "",
    conv.subId1 || "",
    conv.subId2 || "",
    conv.eventName || "default",
    conv.revenue || 0,
    conv.payout || 0,
    conv.timestamp
  );

  incrementOfferConversions(conv.offerId);
  return conv;
}

export function getConversionByClickId(clickId: string): Conversion | undefined {
  const row = db.prepare("SELECT * FROM conversions WHERE click_id = ?").get(clickId) as any;
  return row ? mapConversionRow(row) : undefined;
}

export function getClickById(clickId: string): Click | undefined {
  const row = db.prepare("SELECT * FROM clicks WHERE id = ?").get(clickId) as any;
  return row ? mapClickRow(row) : undefined;
}

export function getConversionsPaginated(page = 1, limit = 20) {
  const totalRow = db.prepare("SELECT COUNT(*) as total FROM conversions").get() as any;
  const offset = (page - 1) * limit;
  const rows = db.prepare("SELECT * FROM conversions ORDER BY timestamp DESC LIMIT ? OFFSET ?").all(limit, offset) as any[];

  return {
    total: totalRow.total,
    page,
    limit,
    data: rows.map(mapConversionRow)
  };
}

// Blacklist Operations
export function getBlacklist(): string[] {
  const rows = db.prepare("SELECT ip FROM blacklist ORDER BY created_at DESC").all() as any[];
  return rows.map(r => r.ip);
}

export function addBlacklistIp(ip: string): void {
  db.prepare("INSERT OR IGNORE INTO blacklist (ip, created_at) VALUES (?, ?)").run(ip.trim(), new Date().toISOString());
}

export function removeBlacklistIp(ip: string): void {
  db.prepare("DELETE FROM blacklist WHERE ip = ?").run(ip.trim());
}

// Auth Database Operations
export function getAdminUserByUsername(username: string) {
  return db.prepare("SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?)").get((username || "").trim()) as any;
}

export function updateAdminPassword(userId: string, newPasswordHash: string): void {
  db.prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(newPasswordHash, userId);
}

// Publishers CRUD
export interface Publisher {
  id: string;
  pubId: string;
  name: string;
  createdAt: string;
}

export function getAllPublishers(): Publisher[] {
  const rows = db.prepare("SELECT * FROM publishers ORDER BY created_at DESC").all() as any[];
  return rows.map(r => ({ id: r.id, pubId: r.pub_id, name: r.name, createdAt: r.created_at }));
}

export function savePublisher(publisher: Publisher): Publisher {
  db.prepare(
    "INSERT INTO publishers (id, pub_id, name, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(pub_id) DO UPDATE SET name = excluded.name"
  ).run(publisher.id, publisher.pubId, publisher.name, publisher.createdAt);
  return publisher;
}

export function deletePublisher(id: string): void {
  db.prepare("DELETE FROM publishers WHERE id = ?").run(id);
}

export function getPublisherByPubId(pubId: string): Publisher | undefined {
  const row = db.prepare("SELECT * FROM publishers WHERE pub_id = ?").get(pubId) as any;
  return row ? { id: row.id, pubId: row.pub_id, name: row.name, createdAt: row.created_at } : undefined;
}

// Stats & Aggregations
export function getDashboardStats() {
  const offers = getAllOffers();
  const totalOffers = offers.length;
  const activeOffers = offers.filter(o => o.status === "active").length;

  const totalClicksRow = db.prepare("SELECT COUNT(*) as cnt FROM clicks").get() as any;
  const totalClicks = totalClicksRow ? totalClicksRow.cnt : 0;

  const passedTrafficRow = db.prepare("SELECT COUNT(*) as cnt FROM clicks WHERE status = 'passed'").get() as any;
  const passedTraffic = passedTrafficRow ? passedTrafficRow.cnt : 0;

  const filteredTrafficRow = db.prepare("SELECT COUNT(*) as cnt FROM clicks WHERE status != 'passed'").get() as any;
  const filteredTraffic = filteredTrafficRow ? filteredTrafficRow.cnt : 0;

  const totalConversionsRow = db.prepare("SELECT COUNT(*) as cnt FROM conversions").get() as any;
  const totalConversions = totalConversionsRow ? totalConversionsRow.cnt : 0;

  const revenueRow = db.prepare("SELECT SUM(revenue) as total FROM conversions").get() as any;
  const totalRevenue = (revenueRow && revenueRow.total) ? revenueRow.total : 0;

  const conversionRate = passedTraffic > 0 ? (totalConversions / passedTraffic) * 100 : 0;

  return {
    totalOffers,
    activeOffers,
    totalClicks,
    filteredTraffic,
    passedTraffic,
    totalConversions,
    conversionRate,
    totalRevenue
  };
}

export function getGeoStats() {
  const rows = db.prepare(`
    SELECT country, COUNT(*) as val
    FROM clicks
    GROUP BY country
    ORDER BY val DESC
    LIMIT 5
  `).all() as any[];

  const geoNames: Record<string, string> = {
    US: "United States",
    CA: "Canada",
    GB: "United Kingdom",
    IN: "India",
    DE: "Germany",
    FR: "France",
    AU: "Australia",
    Unknown: "Unknown"
  };

  return rows.map(r => ({
    name: geoNames[r.country] || r.country,
    code: r.country,
    val: r.val
  }));
}

export function getHourlyPerformance() {
  const buckets = [
    { time: "00:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "04:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "08:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "12:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "16:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "20:00", clicks: 0, revenue: 0, filtered: 0 }
  ];

  // Fetch only last 24 hours of traffic to optimize memory & query execution speed
  const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const clicks = db.prepare("SELECT timestamp, status, revenue FROM clicks WHERE timestamp >= ?").all(past24h) as any[];

  clicks.forEach(c => {
    const time = new Date(c.timestamp);
    const hour = time.getHours();
    let bIdx = 0;
    if (hour >= 20) bIdx = 5;
    else if (hour >= 16) bIdx = 4;
    else if (hour >= 12) bIdx = 3;
    else if (hour >= 8) bIdx = 2;
    else if (hour >= 4) bIdx = 1;

    buckets[bIdx].clicks += 1;
    if (c.status === "passed") {
      buckets[bIdx].revenue += (c.revenue || 0);
    } else {
      buckets[bIdx].filtered += 1;
    }
  });

  return buckets;
}

export function getPublishersStats() {
  const rows = db.prepare(`
    SELECT
      COALESCE(NULLIF(pub_id, ''), 'Direct') as id,
      COUNT(*) as clickCount,
      SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed,
      SUM(CASE WHEN status != 'passed' THEN 1 ELSE 0 END) as filtered,
      SUM(CASE WHEN status = 'passed' THEN revenue ELSE 0 END) as revenue
    FROM clicks
    GROUP BY COALESCE(NULLIF(pub_id, ''), 'Direct')
    ORDER BY clickCount DESC
  `).all() as any[];

  return rows.map(r => ({
    id: r.id,
    name: r.id,
    clickCount: r.clickCount,
    passed: r.passed,
    filtered: r.filtered,
    payout: r.revenue,
    revenue: r.revenue
  }));
}

// Row Mapper Helpers
function mapOfferRow(r: any, cachedPassedClicks?: number): Offer {
  const totalConversions = r.total_conversions || 0;
  const clickCount = r.click_count || 0;
  let passedClicks = cachedPassedClicks;
  if (passedClicks === undefined) {
    const passedClicksRow = db.prepare("SELECT COUNT(*) as cnt FROM clicks WHERE offer_id = ? AND status = 'passed'").get(r.id) as any;
    passedClicks = passedClicksRow ? passedClicksRow.cnt : 0;
  }
  const conversionRate = passedClicks > 0 ? (totalConversions / passedClicks) * 100 : 0;

  return {
    _id: r.id,
    name: r.name,
    destinationUrl: r.destination_url,
    fallbackUrl: r.fallback_url,
    payout: r.payout,
    revenue: r.revenue,
    geoTargeting: JSON.parse(r.geo_targeting || "[]"),
    cityTargeting: JSON.parse(r.city_targeting || "[]"),
    deviceType: r.device_type,
    osType: r.os_type,
    browserTargeting: JSON.parse(r.browser_targeting || "[]"),
    ispTargeting: JSON.parse(r.isp_targeting || "[]"),
    dailyCap: r.daily_cap,
    hourlyCap: r.hourly_cap,
    startDate: r.start_date || undefined,
    endDate: r.end_date || undefined,
    duplicateWindowMinutes: r.duplicate_window_minutes,
    events: JSON.parse(r.events || "[]"),
    actionOnFilter: r.action_on_filter,
    blockBots: Boolean(r.block_bots),
    triggerDelayMs: r.trigger_delay_ms,
    triggerIntervalMs: r.trigger_interval_ms,
    triggerRepeatCount: r.trigger_repeat_count,
    frequencyCap: r.frequency_cap,
    targetPages: JSON.parse(r.target_pages || "[]"),
    sessionCheckEnabled: Boolean(r.session_check_enabled),
    sessionTtlMinutes: r.session_ttl_minutes || 1440,
    trackingUrls: JSON.parse(r.tracking_urls || "[]"),
    redirectType: r.redirect_type || "302",
    customReferrerUrl: r.custom_referrer_url || "",
    targetPageRules: JSON.parse(r.target_page_rules || "[]"),
    status: r.status,
    clickCount,
    totalConversions,
    conversionRate,
    createdAt: r.created_at
  };
}

function mapClickRow(r: any): Click {
  return {
    _id: r.id,
    offerId: r.offer_id,
    sessionId: r.session_id || "",
    pubId: r.pub_id || "",
    subId1: r.sub_id1 || "",
    subId2: r.sub_id2 || "",
    ip: r.ip,
    country: r.country,
    city: r.city,
    device: r.device,
    os: r.os,
    browser: r.browser,
    isp: r.isp,
    userAgent: r.user_agent,
    status: r.status,
    filterReason: r.filter_reason || "",
    revenue: r.revenue,
    timestamp: r.timestamp
  };
}

function mapConversionRow(r: any): Conversion {
  return {
    _id: r.id,
    clickId: r.click_id,
    offerId: r.offer_id,
    pubId: r.pub_id || "",
    subId1: r.sub_id1 || "",
    subId2: r.sub_id2 || "",
    eventName: r.event_name || "default",
    revenue: r.revenue,
    payout: r.payout,
    timestamp: r.timestamp
  };
}

// Automated retention cleanup function to prune click logs older than X days
export function pruneOldClicks(retentionDays = 30): number {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const res = db.prepare("DELETE FROM clicks WHERE timestamp < ?").run(cutoff);
  return res.changes;
}

// Initialize SQLite tables and indexes immediately upon import
initDB();
