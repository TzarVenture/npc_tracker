/* server.ts: Main Express server handling API endpoints, SQLite DB operations, JWT Auth, and traffic routing pipeline. */
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import geoip from "geoip-lite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  getAllOffers,
  getOfferById,
  saveOffer,
  deleteOffer,
  recordClick,
  recordConversion,
  getConversionByClickId,
  getClickById,
  getClicksPaginated,
  getAllClicksFiltered,
  getConversionsPaginated,
  getBlacklist,
  addBlacklistIp,
  removeBlacklistIp,
  getGlobalTrackingState,
  setGlobalTrackingState,
  getDashboardStats,
  getGeoStats,
  getHourlyPerformance,
  getPublishersStats,
  getAdminUserByUsername,
  updateAdminPassword,
  getAllPublishers,
  savePublisher,
  deletePublisher,
  getClicksTodayCount,
  getClicksHourlyCount,
  hasRecentClickFromIp,
  incrementOfferClickCount
} from "./db";
import { authMiddleware, AuthenticatedRequest, JWT_SECRET } from "./authMiddleware";
import { Offer, Click, Conversion } from "./src/types";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Warn if JWT secret is the insecure hardcoded fallback
if (!process.env.JWT_SECRET) {
  console.warn("\n  ⚠️  WARNING: JWT_SECRET is not set in .env — using insecure default. Set a strong secret before production deployment!\n");
}

// ==========================================
// IN-MEMORY LOGIN RATE LIMITER (Brute-Force Protection)
// Max 10 failed attempts per IP per 15 minutes
// ==========================================
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  let entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    loginAttempts.set(ip, entry);
  }
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  return { blocked: entry.count >= RATE_LIMIT_MAX, remaining };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  let entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count += 1;
  loginAttempts.set(ip, entry);
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

app.use(cors());
app.use(express.json());

// Helper to determine visitor attributes from user-agent
const parseUA = (ua: string) => {
  const lower = (ua || "").toLowerCase();
  let device = "Desktop";
  let os = "Unknown";
  let browser = "Unknown";

  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(lower)) {
    device = "Mobile";
  } else if (/ipad|tablet|playbook|silk/i.test(lower)) {
    device = "Tablet";
  }

  if (/iphone|ipad|ipod/i.test(lower)) {
    os = "iOS";
  } else if (/android/i.test(lower)) {
    os = "Android";
  } else if (/windows/i.test(lower)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(lower)) {
    os = "macOS";
  } else if (/linux/i.test(lower)) {
    os = "Linux";
  }

  if (/edg/i.test(lower)) browser = "Edge";
  else if (/chrome|crios/i.test(lower) && !/edg/i.test(lower)) browser = "Chrome";
  else if (/firefox|fxios/i.test(lower)) browser = "Firefox";
  else if (/safari/i.test(lower) && !/chrome/i.test(lower)) browser = "Safari";

  return { device, os, browser };
};

// Bot check helper
const isBot = (ua: string) => {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return /bot|crawler|spider|crawling|googlebot|bingbot|yandex|slurp|duckduckbot|chrome-lighthouse|lighthouse/i.test(lower);
};

// Country/City mapping using geoip-lite
const getGeoFromIp = (ip: string) => {
  const cleanIp = (ip || "").trim();
  if (cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.")) {
    return { country: "IN", city: "Mumbai" };
  }
  const geo = geoip.lookup(cleanIp);
  return {
    country: geo ? geo.country : "IN",
    city: (geo && geo.city) ? geo.city : "Mumbai"
  };
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post("/api/auth/login", (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
  const { username, password } = req.body;

  // Check rate limit before any DB lookup
  const rateCheck = checkRateLimit(clientIp);
  if (rateCheck.blocked) {
    return res.status(429).json({ error: "Too many failed login attempts. Try again in 15 minutes." });
  }

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = getAdminUserByUsername(username);
  if (!user) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  clearAttempts(clientIp);
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

app.get("/api/auth/me", authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({ success: true, user: req.user });
});

// Change Admin Password (requires current password verification)
app.post("/api/auth/change-password", authMiddleware, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required." });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const user = getAdminUserByUsername(req.user!.username);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: "Current password is incorrect." });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);
  updateAdminPassword(user.id, newHash);
  res.json({ success: true, message: "Password updated successfully." });
});

// ==========================================
// PUBLIC HEALTH & SYSTEM STATUS
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", globalTracking: getGlobalTrackingState() });
});

app.get("/api/global-tracking", (req, res) => {
  res.json({ globalTracking: getGlobalTrackingState() });
});

app.post("/api/global-tracking", authMiddleware, (req, res) => {
  const { active } = req.body;
  setGlobalTrackingState(active !== false);
  res.json({ success: true, globalTracking: getGlobalTrackingState() });
});

// ==========================================
// CAMPAIGN / OFFER MANAGEMENT (CRUD)
// ==========================================

app.get("/api/offers", (req, res) => {
  res.json(getAllOffers());
});

app.post("/api/offers", authMiddleware, (req, res) => {
  const {
    name,
    destinationUrl,
    fallbackUrl,
    payout,
    revenue,
    geoTargeting,
    cityTargeting,
    deviceType,
    osType,
    browserTargeting,
    ispTargeting,
    dailyCap,
    hourlyCap,
    startDate,
    endDate,
    duplicateWindowMinutes,
    events,
    actionOnFilter,
    blockBots,
    targetPages,
    triggerDelayMs,
    triggerIntervalMs,
    triggerRepeatCount,
    frequencyCap,
    sessionCheckEnabled,
    sessionTtlMinutes,
    trackingUrls,
    redirectType,
    customReferrerUrl
  } = req.body;

  if (!name || !destinationUrl) {
    return res.status(400).json({ error: "Campaign Name and Destination URL are required." });
  }

  const newOffer: Offer = {
    _id: "off-" + Math.random().toString(36).substring(2, 9),
    name,
    destinationUrl,
    fallbackUrl: fallbackUrl || destinationUrl,
    payout: Number(payout) || 0,
    revenue: Number(revenue) || 10,
    geoTargeting: geoTargeting || [],
    cityTargeting: cityTargeting || [],
    deviceType: deviceType || "All",
    osType: osType || "All",
    browserTargeting: browserTargeting || [],
    ispTargeting: ispTargeting || [],
    dailyCap: Number(dailyCap) || 0,
    hourlyCap: Number(hourlyCap) || 0,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    duplicateWindowMinutes: Number(duplicateWindowMinutes) || 0,
    events: Array.isArray(events) ? events : [],
    actionOnFilter: actionOnFilter || "redirect",
    blockBots: blockBots === true || blockBots === "true",
    targetPages: Array.isArray(targetPages) ? targetPages : [],
    triggerDelayMs: Number(triggerDelayMs) || 0,
    triggerIntervalMs: Number(triggerIntervalMs) || 0,
    triggerRepeatCount: Number(triggerRepeatCount) || 0,
    frequencyCap: frequencyCap || "unlimited",
    sessionCheckEnabled: sessionCheckEnabled === true || sessionCheckEnabled === "true",
    sessionTtlMinutes: Number(sessionTtlMinutes) || 1440,
    trackingUrls: Array.isArray(trackingUrls) ? trackingUrls : [],
    redirectType: redirectType || "302",
    customReferrerUrl: customReferrerUrl || "",
    status: "active",
    clickCount: 0,
    totalConversions: 0,
    conversionRate: 0,
    createdAt: new Date().toISOString()
  };

  const created = saveOffer(newOffer);
  res.status(201).json(created);
});

app.put("/api/offers/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const existing = getOfferById(id);
  if (!existing) return res.status(404).json({ error: "Campaign not found" });

  const updatedOffer: Offer = {
    ...existing,
    ...req.body
  };

  const saved = saveOffer(updatedOffer);
  res.json(saved);
});

app.delete("/api/offers/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  deleteOffer(id);
  res.json({ success: true, message: "Campaign deleted successfully." });
});

// ==========================================
// CONVERSION / POSTBACK TRACKING ENDPOINT
// ==========================================

app.get("/api/postback", (req, res) => {
  const { click_id, payout, revenue, event, token, secret } = req.query;

  // Postback Security Verification (Security Token Check)
  const configuredSecret = process.env.POSTBACK_SECRET;
  if (configuredSecret && configuredSecret.trim()) {
    const providedToken = String(token || secret || "").trim();
    if (providedToken !== configuredSecret.trim()) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing postback security token" });
    }
  }

  if (!click_id) {
    return res.status(400).json({ error: "Missing click_id parameter" });
  }

  const clickIdStr = String(click_id);
  const click = getClickById(clickIdStr);
  if (!click) {
    return res.status(404).json({ error: "Click not found" });
  }

  const existingConv = getConversionByClickId(clickIdStr);
  if (existingConv) {
    return res.status(409).json({ error: "Conversion already recorded for this click" });
  }

  const offer = getOfferById(click.offerId);

  // Session Check Validation
  if (offer && offer.sessionCheckEnabled) {
    const clickTime = new Date(click.timestamp).getTime();
    const ttlMs = (offer.sessionTtlMinutes || 1440) * 60 * 1000;
    if (Date.now() - clickTime > ttlMs) {
      return res.status(403).json({ error: "Session validation failed: Session window expired" });
    }
  }

  const eventName = (event as string) || "default";

  // Check if custom multi-event rates exist
  let convRevenue = offer ? offer.revenue : 0;
  let convPayout = offer ? offer.payout : 0;

  if (offer && offer.events && offer.events.length > 0) {
    const matchedEvent = offer.events.find(e => e.eventName.toLowerCase() === eventName.toLowerCase());
    if (matchedEvent) {
      convRevenue = matchedEvent.revenue;
      convPayout = matchedEvent.payout;
    }
  }

  if (revenue) convRevenue = Number(revenue);
  if (payout) convPayout = Number(payout);

  const newConv: Conversion = {
    _id: "conv-" + Math.random().toString(36).substring(2, 9),
    clickId: click._id,
    offerId: click.offerId,
    pubId: click.pubId,
    subId1: click.subId1,
    subId2: click.subId2,
    eventName,
    revenue: convRevenue,
    payout: convPayout,
    timestamp: new Date().toISOString()
  };

  recordConversion(newConv);
  res.json({ success: true, message: "Conversion recorded", conversion: newConv });
});

// ==========================================
// ANALYTICS & REPORTING ENDPOINTS
// ==========================================

app.get("/api/stats", (req, res) => {
  res.json(getDashboardStats());
});

app.get("/api/stats/live", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  res.json(getClicksPaginated(1, limit).data);
});

app.get("/api/clicks", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offerId = req.query.offerId as string;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  res.json(getClicksPaginated(page, limit, offerId, status, search, startDate, endDate));
});

// Stream Server-Side CSV Export
app.get("/api/clicks/export", authMiddleware, (req, res) => {
  const offerId = req.query.offerId as string;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const allClicks = getAllClicksFiltered(offerId, status, search, startDate, endDate);
  const offers = getAllOffers();

  const getCampaignName = (oId: string) => {
    const found = offers.find(o => o._id === oId);
    return found ? found.name : "Unknown";
  };

  const headers = [
    "Click ID",
    "Timestamp",
    "Campaign ID",
    "Campaign Name",
    "IP Address",
    "Country",
    "City",
    "Device",
    "OS",
    "Browser",
    "ISP",
    "Publisher ID",
    "Sub ID 1",
    "Sub ID 2",
    "Status",
    "Filter Reason",
    "Revenue ($)"
  ];

  const rows = allClicks.map(c => [
    c._id,
    c.timestamp,
    c.offerId,
    `"${getCampaignName(c.offerId).replace(/"/g, '""')}"`,
    c.ip,
    c.country,
    c.city || "",
    c.device,
    c.os,
    c.browser || "",
    `"${(c.isp || "").replace(/"/g, '""')}"`,
    c.pubId || "",
    c.subId1 || "",
    c.subId2 || "",
    c.status,
    `"${(c.filterReason || "").replace(/"/g, '""')}"`,
    c.revenue
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=npc_tracker_export_${new Date().toISOString().split("T")[0]}.csv`);
  res.status(200).send(csvContent);
});

app.get("/api/conversions", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  res.json(getConversionsPaginated(page, limit));
});

// Publishers API — Full Persistent CRUD
app.get("/api/publishers", (req, res) => {
  const registered = getAllPublishers();
  const stats = getPublishersStats();
  // Merge registered publisher names with live click stats
  const statsMap = new Map(stats.map((s: any) => [s.id, s]));
  const enriched = registered.map(p => {
    const s = statsMap.get(p.pubId) || { clickCount: 0, passed: 0, filtered: 0, revenue: 0, payout: 0 };
    return { ...p, ...s, id: p.pubId, name: p.name };
  });
  // Also include pub IDs from click history that are NOT registered
  const registeredIds = new Set(registered.map(p => p.pubId));
  const unregistered = stats
    .filter((s: any) => !registeredIds.has(s.id) && s.id !== "Direct")
    .map((s: any) => ({ ...s, name: s.id }));
  res.json([...enriched, ...unregistered]);
});

app.post("/api/publishers", authMiddleware, (req, res) => {
  const { pubId, name } = req.body;
  if (!pubId || !pubId.trim()) {
    return res.status(400).json({ error: "Publisher ID (pub_id) is required." });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Publisher Name is required." });
  }
  const publisher = {
    id: "pub-" + Math.random().toString(36).substring(2, 9),
    pubId: pubId.trim().toUpperCase(),
    name: name.trim(),
    createdAt: new Date().toISOString()
  };
  try {
    const saved = savePublisher(publisher);
    res.status(201).json(saved);
  } catch (err: any) {
    if (err.message && err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: `Publisher ID "${publisher.pubId}" already exists.` });
    }
    res.status(500).json({ error: "Failed to save publisher." });
  }
});

app.delete("/api/publishers/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  deletePublisher(id);
  res.json({ success: true, message: "Publisher removed." });
});

app.get("/api/blacklist", (req, res) => {
  res.json(getBlacklist());
});

app.post("/api/blacklist", authMiddleware, (req, res) => {
  const { ip } = req.body;
  if (ip) {
    addBlacklistIp(ip);
  }
  res.json(getBlacklist());
});

app.delete("/api/blacklist/:ip", authMiddleware, (req, res) => {
  const { ip } = req.params;
  removeBlacklistIp(ip);
  res.json(getBlacklist());
});

app.get("/api/stats/geos", (req, res) => {
  res.json(getGeoStats());
});

app.get("/api/stats/performance", (req, res) => {
  res.json(getHourlyPerformance());
});

// Helper to pick destination URL from offer trackingUrls by weight & targeting
const selectDestinationUrl = (offer: Offer, geo: string, device: string): string => {
  if (offer.trackingUrls && offer.trackingUrls.length > 0) {
    const activeUrls = offer.trackingUrls.filter(u => {
      if (u.status !== "active") return false;
      if (u.deviceType && u.deviceType !== "All" && u.deviceType !== device) return false;
      if (u.geoTargeting && u.geoTargeting.length > 0 && !u.geoTargeting.includes(geo)) return false;
      return true;
    });

    if (activeUrls.length > 0) {
      const totalWeight = activeUrls.reduce((sum, u) => sum + (Number(u.weight) || 0), 0);
      if (totalWeight > 0) {
        let random = Math.random() * totalWeight;
        for (const item of activeUrls) {
          const w = Number(item.weight) || 0;
          if (random < w) {
            return item.url;
          }
          random -= w;
        }
      }
      return activeUrls[0].url;
    }
  }
  return offer.destinationUrl;
};

// Redirect Execution Engine supporting 302, 307, Meta, Double Meta, and Custom Referrer Hiding
const executeRedirect = (res: express.Response, offer: Offer, finalDest: string) => {
  let targetUrl = finalDest;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "http://" + targetUrl;
  }

  const redirectType = offer.redirectType || "302";

  if (redirectType === "307") {
    res.setHeader("Referrer-Policy", "no-referrer");
    return res.redirect(307, targetUrl);
  }

  if (redirectType === "meta") {
    return res.type("html").send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="refresh" content="0;url=${encodeURI(targetUrl)}">
  <title>Redirecting...</title>
</head>
<body>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>
    `);
  }

  if (redirectType === "double_meta") {
    // Single-page JS redirect with no-referrer policy — eliminates the two-hop white flash
    return res.type("html").send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <title>Redirecting...</title>
</head>
<body>
  <script>
    (function(){
      try { document.referrer; } catch(e) {}
      window.location.replace(${JSON.stringify(targetUrl)});
    })();
  </script>
</body>
</html>`);
  }

  if (redirectType === "custom_referrer") {
    const customRef = offer.customReferrerUrl || "";
    return res.type("html").send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="${customRef ? 'origin' : 'no-referrer'}">
  <title>Redirecting...</title>
</head>
<body>
  <script>
    ${customRef ? `try { history.replaceState(null, "", "${customRef}"); } catch(e) {}` : ''}
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>
</body>
</html>
    `);
  }

  // Default: HTTP 302
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.redirect(302, targetUrl);
};

// Clean Redirect intermediate handler for Double Meta Refresh
app.get("/clean-redirect", (req, res) => {
  const dest = req.query.dest as string;
  if (!dest) return res.status(400).send("<h1>Error: Missing destination</h1>");

  res.type("html").send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="refresh" content="0;url=${encodeURI(dest)}">
  <title>Redirecting...</title>
</head>
<body>
  <script>window.location.replace(${JSON.stringify(dest)});</script>
</body>
</html>
  `);
});

// Traffic Click Simulator
app.post("/api/simulate", (req, res) => {
  const { offerId, ip, country, userAgent, pubId, subId1, subId2, city, isp } = req.body;

  const offer = getOfferById(offerId);
  if (!offer) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const clientIp = ip || "192.168.12.34";
  const geo = getGeoFromIp(clientIp);
  const clientCountry = country || geo.country;
  const clientCity = city || geo.city;
  const clientUA = userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
  const { device, os, browser } = parseUA(clientUA);
  const clientIsp = isp || "Unknown ISP";

  let status: "passed" | "filtered" | "capped" | "blocked" = "passed";
  let filterReason = "";
  let finalUrl = selectDestinationUrl(offer, clientCountry, device);

  const nowIso = new Date().toISOString();
  const blacklist = getBlacklist();

  if (!getGlobalTrackingState()) {
    status = "filtered";
    filterReason = "Global Tracking Suspended";
  } else if (offer.status !== "active") {
    status = "filtered";
    filterReason = "Campaign Paused";
  } else if (offer.startDate && nowIso < offer.startDate) {
    status = "filtered";
    filterReason = `Campaign Schedule Pending (Starts ${offer.startDate})`;
  } else if (offer.endDate && nowIso > offer.endDate) {
    status = "filtered";
    filterReason = `Campaign Schedule Expired (Ended ${offer.endDate})`;
  } else if (blacklist.includes(clientIp)) {
    status = "blocked";
    filterReason = "IP Blacklisted";
  } else if (offer.blockBots && isBot(clientUA)) {
    status = "blocked";
    filterReason = "Bot Signature Detected";
  } else if (offer.duplicateWindowMinutes && offer.duplicateWindowMinutes > 0 && hasRecentClickFromIp(offer._id, clientIp, offer.duplicateWindowMinutes)) {
    status = "filtered";
    filterReason = `Duplicate Click Window Active (${offer.duplicateWindowMinutes} mins)`;
  } else if (offer.geoTargeting && offer.geoTargeting.length > 0 && !offer.geoTargeting.includes(clientCountry)) {
    status = "filtered";
    filterReason = `Country Restricted (Allowed: ${offer.geoTargeting.join(", ")})`;
  } else if (offer.cityTargeting && offer.cityTargeting.length > 0 && !offer.cityTargeting.includes(clientCity.toUpperCase())) {
    status = "filtered";
    filterReason = `City Restricted (Allowed: ${offer.cityTargeting.join(", ")})`;
  } else if (offer.browserTargeting && offer.browserTargeting.length > 0 && !offer.browserTargeting.includes(browser.toUpperCase())) {
    status = "filtered";
    filterReason = `Browser Restricted (Allowed: ${offer.browserTargeting.join(", ")})`;
  } else if (offer.ispTargeting && offer.ispTargeting.length > 0 && !offer.ispTargeting.includes(clientIsp.toUpperCase())) {
    status = "filtered";
    filterReason = `ISP Restricted (Allowed: ${offer.ispTargeting.join(", ")})`;
  } else if (offer.deviceType && offer.deviceType !== "All" && offer.deviceType !== device) {
    status = "filtered";
    filterReason = `Device Restricted (Allowed: ${offer.deviceType})`;
  } else if (offer.osType && offer.osType !== "All" && offer.osType !== os) {
    status = "filtered";
    filterReason = `OS Restricted (Allowed: ${offer.osType})`;
  } else if (offer.hourlyCap && offer.hourlyCap > 0 && getClicksHourlyCount(offer._id) >= offer.hourlyCap) {
    status = "capped";
    filterReason = "Hourly Click Cap Reached";
  } else if (offer.dailyCap && offer.dailyCap > 0 && getClicksTodayCount(offer._id) >= offer.dailyCap) {
    status = "capped";
    filterReason = "Daily Click Cap Reached";
  }

  if (status !== "passed") {
    if (offer.actionOnFilter === "drop") {
      return res.json({ success: true, outcome: "dropped", reason: filterReason, actionTaken: "drop" });
    } else if (offer.actionOnFilter === "block") {
      finalUrl = "BLOCK_ACCESS_DENIED";
    } else if (offer.actionOnFilter === "redirect") {
      finalUrl = offer.fallbackUrl;
    } else if (offer.actionOnFilter === "log") {
      finalUrl = offer.destinationUrl;
    }
  } else {
    incrementOfferClickCount(offer._id);
  }

  if (finalUrl !== "BLOCK_ACCESS_DENIED") {
    finalUrl = finalUrl
      .replace(/{pub_id}/g, pubId || "")
      .replace(/{sub_id1}/g, subId1 || "")
      .replace(/{sub_id2}/g, subId2 || "");
  }

  const newClick: Click = {
    _id: "click-" + Math.random().toString(36).substring(2, 9),
    offerId: offer._id,
    pubId,
    subId1,
    subId2,
    ip: clientIp,
    country: clientCountry,
    city: clientCity,
    device,
    os,
    browser,
    isp: clientIsp,
    userAgent: clientUA,
    status,
    filterReason,
    revenue: status === "passed" ? offer.revenue : 0,
    timestamp: new Date().toISOString()
  };

  recordClick(newClick);

  res.json({
    success: true,
    outcome: status,
    reason: filterReason,
    originalDest: offer.destinationUrl,
    fallbackDest: offer.fallbackUrl,
    finalDest: finalUrl,
    actionTaken: offer.actionOnFilter,
    click: newClick
  });
});

// ==========================================
// CLIENT-SIDE PIXEL TRACKING ENDPOINT
// Primary: POST /px  (stealth CDN-like URL)
// Alias:   POST /api/pixel-track (backward compat)
// ==========================================
const handlePixelTrack = (req: express.Request, res: express.Response) => {
  const targetOfferId = req.body.offer_id || req.body.offerId;
  const { pub_id, pubId, sub_id1, subId1, sub_id2, subId2, isp } = req.body;

  // Silent 204 — no error body visible in DevTools console
  if (!targetOfferId) return res.status(204).end();
  const offer = getOfferById(targetOfferId);
  if (!offer) return res.status(204).end();

  const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgentStr = req.headers["user-agent"] || "";
  const ipString = Array.isArray(clientIp) ? clientIp[0] : clientIp;
  const geo = getGeoFromIp(ipString);
  const { device, os, browser } = parseUA(userAgentStr);
  const clientIsp = isp || "Unknown ISP";

  let status: "passed" | "filtered" | "capped" | "blocked" = "passed";
  let filterReason = "";
  const nowIso = new Date().toISOString();
  const blacklist = getBlacklist();

  if (!getGlobalTrackingState()) {
    status = "filtered"; filterReason = "Global Tracking Suspended";
  } else if (offer.status !== "active") {
    status = "filtered"; filterReason = "Campaign Paused";
  } else if (offer.startDate && nowIso < offer.startDate) {
    status = "filtered"; filterReason = "Campaign Schedule Pending";
  } else if (offer.endDate && nowIso > offer.endDate) {
    status = "filtered"; filterReason = "Campaign Schedule Expired";
  } else if (blacklist.includes(ipString)) {
    status = "blocked"; filterReason = "IP Blacklisted";
  } else if (offer.blockBots && isBot(userAgentStr)) {
    status = "blocked"; filterReason = "Bot Signature Detected";
  } else if (offer.duplicateWindowMinutes && offer.duplicateWindowMinutes > 0 && hasRecentClickFromIp(offer._id, ipString, offer.duplicateWindowMinutes)) {
    status = "filtered"; filterReason = "Duplicate Click Window Active";
  } else if (offer.geoTargeting && offer.geoTargeting.length > 0 && !offer.geoTargeting.includes(geo.country)) {
    status = "filtered"; filterReason = "Geo Restricted";
  } else if (offer.cityTargeting && offer.cityTargeting.length > 0 && !offer.cityTargeting.includes(geo.city.toUpperCase())) {
    status = "filtered"; filterReason = "City Restricted";
  } else if (offer.browserTargeting && offer.browserTargeting.length > 0 && !offer.browserTargeting.includes(browser.toUpperCase())) {
    status = "filtered"; filterReason = "Browser Restricted";
  } else if (offer.ispTargeting && offer.ispTargeting.length > 0 && !offer.ispTargeting.includes(clientIsp.toUpperCase())) {
    status = "filtered"; filterReason = "ISP Restricted";
  } else if (offer.deviceType && offer.deviceType !== "All" && offer.deviceType !== device) {
    status = "filtered"; filterReason = "Device Restricted";
  } else if (offer.osType && offer.osType !== "All" && offer.osType !== os) {
    status = "filtered"; filterReason = "OS Restricted";
  } else if (offer.hourlyCap && offer.hourlyCap > 0 && getClicksHourlyCount(offer._id) >= offer.hourlyCap) {
    status = "capped"; filterReason = "Hourly Click Cap Reached";
  } else if (offer.dailyCap && offer.dailyCap > 0 && getClicksTodayCount(offer._id) >= offer.dailyCap) {
    status = "capped"; filterReason = "Daily Click Cap Reached";
  }

  if (status !== "passed" && offer.actionOnFilter === "drop") return res.status(204).end();
  if (status === "passed") incrementOfferClickCount(offer._id);

  const clickLog: Click = {
    _id: "click-" + Math.random().toString(36).substring(2, 9),
    offerId: offer._id,
    pubId: String(pub_id || pubId || ""),
    subId1: String(sub_id1 || subId1 || ""),
    subId2: String(sub_id2 || subId2 || ""),
    ip: ipString,
    country: geo.country,
    city: geo.city,
    device, os, browser,
    isp: clientIsp,
    userAgent: userAgentStr,
    status, filterReason,
    revenue: status === "passed" ? offer.revenue : 0,
    timestamp: new Date().toISOString()
  };

  recordClick(clickLog);
  // 204 No Content — zero visible response body in Network tab
  res.status(204).end();
};

// Primary stealth URL (looks like CDN analytics ping in DevTools)
app.post("/px", handlePixelTrack);
// Backward-compat alias — legacy integrations keep working
app.post("/api/pixel-track", handlePixelTrack);

// ==========================================
// REAL-TIME TRACKING REDIRECT ENDPOINT
// ==========================================
app.get("/track", (req, res) => {
  const { offer_id, pub_id, sub_id1, sub_id2 } = req.query;

  if (!offer_id) {
    return res.status(400).send("<h1>Error: Missing offer_id</h1>");
  }

  const offer = getOfferById(String(offer_id));
  if (!offer) {
    return res.status(404).send("<h1>Error: Campaign Not Found</h1>");
  }

  const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgentStr = req.headers["user-agent"] || "";
  const ipString = Array.isArray(clientIp) ? clientIp[0] : clientIp;
  const geo = getGeoFromIp(ipString);
  const { device, os, browser } = parseUA(userAgentStr);
  const clientIsp = "Unknown ISP";

  let status: "passed" | "filtered" | "capped" | "blocked" = "passed";
  let filterReason = "";
  let finalUrl = selectDestinationUrl(offer, geo.country, device);
  const sessionId = "sess-" + Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 9);
  const nowIso = new Date().toISOString();
  const blacklist = getBlacklist();

  if (!getGlobalTrackingState()) {
    status = "filtered";
    filterReason = "Global Tracking Suspended";
  } else if (offer.status !== "active") {
    status = "filtered";
    filterReason = "Campaign Paused";
  } else if (offer.startDate && nowIso < offer.startDate) {
    status = "filtered";
    filterReason = "Campaign Schedule Pending";
  } else if (offer.endDate && nowIso > offer.endDate) {
    status = "filtered";
    filterReason = "Campaign Schedule Expired";
  } else if (blacklist.includes(ipString)) {
    status = "blocked";
    filterReason = "IP Blacklisted";
  } else if (offer.blockBots && isBot(userAgentStr)) {
    status = "blocked";
    filterReason = "Bot Signature Detected";
  } else if (offer.duplicateWindowMinutes && offer.duplicateWindowMinutes > 0 && hasRecentClickFromIp(offer._id, ipString, offer.duplicateWindowMinutes)) {
    status = "filtered";
    filterReason = "Duplicate Click Window Active";
  } else if (offer.geoTargeting && offer.geoTargeting.length > 0 && !offer.geoTargeting.includes(geo.country)) {
    status = "filtered";
    filterReason = "Geo Restricted";
  } else if (offer.cityTargeting && offer.cityTargeting.length > 0 && !offer.cityTargeting.includes(geo.city.toUpperCase())) {
    status = "filtered";
    filterReason = "City Restricted";
  } else if (offer.browserTargeting && offer.browserTargeting.length > 0 && !offer.browserTargeting.includes(browser.toUpperCase())) {
    status = "filtered";
    filterReason = "Browser Restricted";
  } else if (offer.ispTargeting && offer.ispTargeting.length > 0 && !offer.ispTargeting.includes(clientIsp.toUpperCase())) {
    status = "filtered";
    filterReason = "ISP Restricted";
  } else if (offer.deviceType && offer.deviceType !== "All" && offer.deviceType !== device) {
    status = "filtered";
    filterReason = "Device Restricted";
  } else if (offer.osType && offer.osType !== "All" && offer.osType !== os) {
    status = "filtered";
    filterReason = "OS Restricted";
  } else if (offer.hourlyCap && offer.hourlyCap > 0 && getClicksHourlyCount(offer._id) >= offer.hourlyCap) {
    status = "capped";
    filterReason = "Hourly Click Cap Reached";
  } else if (offer.dailyCap && offer.dailyCap > 0 && getClicksTodayCount(offer._id) >= offer.dailyCap) {
    status = "capped";
    filterReason = "Daily Click Cap Reached";
  }

  if (status !== "passed") {
    if (offer.actionOnFilter === "drop") {
      return res.status(403).send("<h1>Request Dropped</h1>");
    } else if (offer.actionOnFilter === "block") {
      const clickLog: Click = {
        _id: "click-" + Math.random().toString(36).substring(2, 9),
        offerId: offer._id,
        sessionId,
        pubId: String(pub_id || ""),
        subId1: String(sub_id1 || ""),
        subId2: String(sub_id2 || ""),
        ip: ipString,
        country: geo.country,
        city: geo.city,
        device,
        os,
        browser,
        isp: clientIsp,
        userAgent: userAgentStr,
        status,
        filterReason,
        revenue: 0,
        timestamp: new Date().toISOString()
      };
      recordClick(clickLog);
      return res.status(403).send("<h1>Access Denied</h1>");
    } else if (offer.actionOnFilter === "redirect") {
      finalUrl = offer.fallbackUrl;
    } else if (offer.actionOnFilter === "log") {
      finalUrl = offer.destinationUrl;
    }
  } else {
    incrementOfferClickCount(offer._id);
  }

  const clickLog: Click = {
    _id: "click-" + Math.random().toString(36).substring(2, 9),
    offerId: offer._id,
    sessionId,
    pubId: String(pub_id || ""),
    subId1: String(sub_id1 || ""),
    subId2: String(sub_id2 || ""),
    ip: ipString,
    country: geo.country,
    city: geo.city,
    device,
    os,
    browser,
    isp: clientIsp,
    userAgent: userAgentStr,
    status,
    filterReason,
    revenue: status === "passed" ? offer.revenue : 0,
    timestamp: new Date().toISOString()
  };

  recordClick(clickLog);

  let finalDest = finalUrl
    .replace(/{pub_id}/g, String(pub_id || ""))
    .replace(/{sub_id1}/g, String(sub_id1 || ""))
    .replace(/{sub_id2}/g, String(sub_id2 || ""));

  if (!/^https?:\/\//i.test(finalDest)) {
    finalDest = "http://" + finalDest;
  }

  // Set session cookie
  res.cookie("tracker_sess", sessionId, {
    maxAge: (offer.sessionTtlMinutes || 1440) * 60 * 1000,
    httpOnly: true
  });

  return executeRedirect(res, offer, finalDest);
});

// ==========================================
// CLIENT-SIDE PIXEL SCRIPT GENERATOR
// URL: /cdn/v2/wgt.js?id=OFFER_ID
// ==========================================
app.get("/cdn/v2/wgt.js", (req, res) => {
  const offerId = String(req.query.id || "");
  const offer = offerId ? getOfferById(offerId) : undefined;

  if (!offer) {
    // Silent empty script — no errors exposed to visitor console
    return res.type("application/javascript")
      .set("Cache-Control", "no-store")
      .send("(function(){})();");
  }

  const targetPagesStr = offer.targetPages && offer.targetPages.length > 0
    ? JSON.stringify(offer.targetPages) : "[]";
  const targetPageRulesStr = offer.targetPageRules && offer.targetPageRules.length > 0
    ? JSON.stringify(offer.targetPageRules) : "[]";
  const delayMs = offer.triggerDelayMs || 0;
  const intervalMs = offer.triggerIntervalMs || 0;
  const repeatCount = offer.triggerRepeatCount || 0;
  const freqCap = offer.frequencyCap || "unlimited";
  const pixelEndpoint = `${req.protocol}://${req.get('host')}/px`;

  const scriptContent = `(function(){
  try{
    var _c={
      oid:${JSON.stringify(offerId)},
      tp:${targetPagesStr},
      tpr:${targetPageRulesStr},
      dMs:${delayMs},
      iMs:${intervalMs},
      rc:${repeatCount},
      fc:${JSON.stringify(freqCap)},
      ep:${JSON.stringify(pixelEndpoint)}
    };

    // Page targeting — check if current URL path matches whitelist or weighted rules
    var _matchPage=function(){
      var p=window.location.pathname;
      // Weighted TargetPageRules (advanced mode)
      if(_c.tpr&&_c.tpr.length>0){
        var active=_c.tpr.filter(function(r){return r.status==='active';});
        if(active.length===0)return null;
        var matched=active.filter(function(r){
          if(r.matchType==='exact')return p===r.path;
          if(r.matchType==='startsWith')return p.indexOf(r.path)===0;
          return p.indexOf(r.path)>-1;
        });
        if(matched.length===0)return null;
        var total=matched.reduce(function(s,r){return s+(r.weight||0);},0);
        if(total<=0)return matched[0];
        var rand=Math.random()*total;
        for(var i=0;i<matched.length;i++){
          rand-=(matched[i].weight||0);
          if(rand<0)return matched[i];
        }
        return matched[0];
      }
      // Simple flat targetPages whitelist
      if(_c.tp&&_c.tp.length>0){
        var ok=_c.tp.some(function(pg){return p.indexOf(pg)>-1;});
        return ok?{}:null;
      }
      return {};
    };

    var _rule=_matchPage();
    if(_rule===null)return;

    var _sk="_ts_"+_c.oid;
    var _uk="_tu_"+_c.oid;
    // Frequency cap — protected from Safari Private Mode SecurityError
    try{
      if(_c.fc==="once_per_session"&&sessionStorage.getItem(_sk))return;
      if(_c.fc==="once_per_user"&&localStorage.getItem(_uk))return;
    }catch(e){}

    var _n=0;

    var _fire=function(){
      try{
        try{
          if(_c.fc==="once_per_session")sessionStorage.setItem(_sk,"1");
          if(_c.fc==="once_per_user")localStorage.setItem(_uk,"1");
        }catch(e){}
        var _q=new URLSearchParams(window.location.search);
        var _pd=JSON.stringify({
          offer_id:_c.oid,
          pub_id:_q.get("pub_id")||"",
          sub_id1:_q.get("sub_id1")||"",
          page_url:window.location.href
        });
        // sendBeacon is fire-and-forget — zero page blocking, works even on page close
        var _sent=false;
        if(typeof navigator.sendBeacon==="function"){
          try{
            _sent=navigator.sendBeacon(_c.ep,new Blob([_pd],{type:"application/json"}));
          }catch(e){}
        }
        if(!_sent){
          try{
            fetch(_c.ep,{method:"POST",headers:{"Content-Type":"application/json"},body:_pd,keepalive:true})
              .catch(function(){});
          }catch(e){}
        }
        _n++;
      }catch(e){}
    };

    var _start=function(){
      _fire();
      if(_c.iMs>0&&(_c.rc===0||_c.rc>1)){
        var _t=setInterval(function(){
          try{
            if(_c.rc>0&&_n>=_c.rc){clearInterval(_t);return;}
            _fire();
          }catch(e){clearInterval(_t);}
        },_c.iMs);
      }
    };

    // Per-rule delay override takes priority over global delayMs
    var _delay=(_rule&&_rule.delayMs!=null)?_rule.delayMs:_c.dMs;
    if(_delay>0){
      setTimeout(_start,_delay);
    }else{
      _start();
    }
  }catch(e){}
})();`;

  res.type("application/javascript")
    .set("Cache-Control", "no-store, no-cache")
    .set("X-Content-Type-Options", "nosniff")
    .send(scriptContent);
});

// Legacy alias kept for backward compatibility — redirects to new stealth endpoint
app.get("/api/script/:offerId.js", (req, res) => {
  res.redirect(302, `/cdn/v2/wgt.js?id=${encodeURIComponent(req.params.offerId)}`);
});


// ==========================================
// VITE MIDDLEWARE INTERACTION (DEV/PROD)
// ==========================================

app.use(express.static(path.join(process.cwd(), "public")));

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  ➜  NPC Tracker Server running at: http://localhost:${PORT}/\n`);
  });
}

startServer();
