/* server.ts: Main Express server handling API endpoints and traffic routing pipeline. */
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import geoip from "geoip-lite";
import { Offer, Click, Conversion } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(cors());
app.use(express.json());

// In-memory database with disk sync
let db: {
  offers: Offer[];
  clicks: Click[];
  conversions: Conversion[];
  globalTracking: boolean;
  blacklist: string[];
} = {
  offers: [],
  clicks: [],
  conversions: [],
  globalTracking: true,
  blacklist: []
};

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      db = {
        offers: parsed.offers || [],
        clicks: parsed.clicks || [],
        conversions: parsed.conversions || [],
        globalTracking: parsed.globalTracking !== false,
        blacklist: parsed.blacklist || []
      };
    } else {
      saveDB();
    }
  } catch (error) {
    console.error("Failed to load local DB, starting empty:", error);
    saveDB();
  }
};

const saveDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to local DB file:", error);
  }
};

// Initialize DB loading
loadDB();

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

// Simple bot check helper
const isBot = (ua: string) => {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return /bot|crawler|spider|crawling|googlebot|bingbot|yandex|slurp|duckduckbot|chrome-lighthouse|lighthouse/i.test(lower);
};

// Real Country/City mapping using geoip-lite
const getGeoFromIp = (ip: string) => {
  const cleanIp = (ip || "").trim();
  if (cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp.startsWith("192.168.")) {
    return { country: "US", city: "Localhost" }; // Default simulation local to US
  }
  const geo = geoip.lookup(cleanIp);
  return {
    country: geo ? geo.country : "Unknown",
    city: (geo && geo.city) ? geo.city : "Unknown"
  };
};

// ==========================================
// API ENDPOINTS
// ==========================================

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", globalTracking: db.globalTracking });
});

// Toggle global tracking status
app.get("/api/global-tracking", (req, res) => {
  res.json({ globalTracking: db.globalTracking });
});

app.post("/api/global-tracking", (req, res) => {
  const { active } = req.body;
  db.globalTracking = active !== false;
  saveDB();
  res.json({ success: true, globalTracking: db.globalTracking });
});

// GET all campaigns/offers
app.get("/api/offers", (req, res) => {
  res.json(db.offers);
});

// POST create campaign/offer
app.post("/api/offers", (req, res) => {
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
    actionOnFilter,
    blockBots
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
    actionOnFilter: actionOnFilter || "redirect",
    targetPages: Array.isArray(targetPages) ? targetPages : [],
    status: "active",
    clickCount: 0,
    totalConversions: 0,
    conversionRate: 0,
    createdAt: new Date().toISOString()
  };

  db.offers.unshift(newOffer);
  saveDB();
  res.status(201).json(newOffer);
});

// PUT update offer
app.put("/api/offers/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.offers.findIndex(o => o._id === id);
  if (idx === -1) return res.status(404).json({ error: "Campaign not found" });

  db.offers[idx] = {
    ...db.offers[idx],
    ...req.body
  };
  saveDB();
  res.json(db.offers[idx]);
});

// DELETE campaign/offer
app.delete("/api/offers/:id", (req, res) => {
  const { id } = req.params;
  db.offers = db.offers.filter(o => o._id !== id);
  db.clicks = db.clicks.filter(c => c.offerId !== id);
  db.conversions = db.conversions.filter(c => c.offerId !== id);
  saveDB();
  res.json({ success: true, message: "Campaign deleted successfully." });
});

// GET Postback / Conversion Tracking
app.get("/api/postback", (req, res) => {
  const { click_id, payout, revenue } = req.query;

  if (!click_id) {
    return res.status(400).json({ error: "Missing click_id parameter" });
  }

  // Check if click exists
  const click = db.clicks.find(c => c._id === click_id);
  if (!click) {
    return res.status(404).json({ error: "Click not found" });
  }

  // Check if already converted
  const existingConv = db.conversions.find(c => c.clickId === click_id);
  if (existingConv) {
    return res.status(409).json({ error: "Conversion already recorded for this click" });
  }

  // Create conversion
  const offer = db.offers.find(o => o._id === click.offerId);
  const convRevenue = revenue ? Number(revenue) : (offer ? offer.revenue : 0);
  const convPayout = payout ? Number(payout) : (offer ? offer.payout : 0);

  const newConv: Conversion = {
    _id: "conv-" + Math.random().toString(36).substring(2, 9),
    clickId: click._id as string,
    offerId: click.offerId,
    pubId: click.pubId,
    subId1: click.subId1,
    subId2: click.subId2,
    revenue: convRevenue,
    payout: convPayout,
    timestamp: new Date().toISOString()
  };

  db.conversions.unshift(newConv);

  // Update offer stats
  if (offer) {
    offer.totalConversions = (offer.totalConversions || 0) + 1;
    offer.conversionRate = offer.clickCount > 0 ? (offer.totalConversions / offer.clickCount) * 100 : 0;
  }

  saveDB();
  res.json({ success: true, message: "Conversion recorded", conversion: newConv });
});

// Aggregated Stats
app.get("/api/stats", (req, res) => {
  const totalOffers = db.offers.length;
  const activeOffers = db.offers.filter(o => o.status === "active").length;

  const totalClicks = db.clicks.length;
  const filteredTraffic = db.clicks.filter(c => ["filtered", "capped", "blocked"].includes(c.status)).length;
  const passedTraffic = db.clicks.filter(c => c.status === "passed").length;

  const totalConversions = db.conversions.length;
  const conversionRate = passedTraffic > 0 ? (totalConversions / passedTraffic) * 100 : 0;

  // Revenue should primarily come from conversions in CPA tracking
  const totalRevenue = db.conversions.reduce((acc, c) => acc + c.revenue, 0);

  res.json({
    totalOffers,
    activeOffers,
    totalClicks,
    filteredTraffic,
    passedTraffic,
    totalConversions,
    conversionRate,
    totalRevenue
  });
});

// Recent Live Clicks Log
app.get("/api/stats/live", (req, res) => {
  const limit = 20;
  const recent = db.clicks.slice(0, limit);
  res.json(recent);
});

// Paginated Clicks Endpoint
app.get("/api/clicks", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = db.clicks.slice(startIndex, endIndex);
  res.json({
    total: db.clicks.length,
    page,
    limit,
    data: results
  });
});

// Paginated Conversions Endpoint
app.get("/api/conversions", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = db.conversions.slice(startIndex, endIndex);
  res.json({
    total: db.conversions.length,
    page,
    limit,
    data: results
  });
});

// Publishers Aggregation Endpoint
app.get("/api/publishers", (req, res) => {
  const pubStats: Record<string, any> = {};
  db.clicks.forEach(c => {
    const pId = c.pubId || "Direct";
    if (!pubStats[pId]) {
      pubStats[pId] = { id: pId, name: pId, clickCount: 0, passed: 0, filtered: 0, payout: 0, revenue: 0 };
    }
    pubStats[pId].clickCount += 1;
    if (c.status === "passed") {
      pubStats[pId].passed += 1;
      pubStats[pId].revenue += c.revenue;
      pubStats[pId].payout = c.revenue;
    } else {
      pubStats[pId].filtered += 1;
    }
  });
  res.json(Object.values(pubStats));
});

// Blacklist API
app.get("/api/blacklist", (req, res) => {
  res.json(db.blacklist || []);
});

app.post("/api/blacklist", (req, res) => {
  const { ip } = req.body;
  if (ip && !db.blacklist.includes(ip)) {
    db.blacklist.push(ip);
    saveDB();
  }
  res.json(db.blacklist);
});

app.delete("/api/blacklist/:ip", (req, res) => {
  const { ip } = req.params;
  db.blacklist = db.blacklist.filter(b => b !== ip);
  saveDB();
  res.json(db.blacklist);
});

// Get Top Countries traffic breakdown
app.get("/api/stats/geos", (req, res) => {
  const geosMap: Record<string, number> = {};
  db.clicks.forEach(c => {
    const geo = c.country || "Unknown";
    geosMap[geo] = (geosMap[geo] || 0) + 1;
  });

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

  const sortedGeos = Object.entries(geosMap)
    .map(([code, count]) => ({
      name: geoNames[code] || code,
      code,
      val: count
    }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);

  res.json(sortedGeos);
});

// Performance Hourly Chart Data
app.get("/api/stats/performance", (req, res) => {
  const buckets = [
    { time: "00:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "04:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "08:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "12:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "16:00", clicks: 0, revenue: 0, filtered: 0 },
    { time: "20:00", clicks: 0, revenue: 0, filtered: 0 }
  ];

  db.clicks.forEach(c => {
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
      buckets[bIdx].revenue += c.revenue;
    } else {
      buckets[bIdx].filtered += 1;
    }
  });

  res.json(buckets);
});

// Traffic Click Simulator
app.post("/api/simulate", (req, res) => {
  const { offerId, ip, country, userAgent, pubId, subId1, subId2, city, isp } = req.body;

  const offer = db.offers.find(o => o._id === offerId);
  if (!offer) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const clientIp = ip || "192.168.1.100";
  const geo = getGeoFromIp(clientIp);
  const clientCountry = country || geo.country;
  const clientCity = city || geo.city;
  const clientUA = userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
  const { device, os, browser } = parseUA(clientUA);
  const clientIsp = isp || "Unknown ISP";

  let status: "passed" | "filtered" | "capped" | "blocked" = "passed";
  let filterReason = "";
  let finalUrl = offer.destinationUrl;

  const today = new Date().toISOString().split('T')[0];
  const clicksToday = db.clicks.filter(c => c.offerId === offer._id && c.timestamp.startsWith(today)).length;

  if (!db.globalTracking) {
    status = "filtered";
    filterReason = "Global Tracking Suspended";
  } else if (offer.status !== "active") {
    status = "filtered";
    filterReason = "Campaign Paused";
  } else if (db.blacklist?.includes(clientIp)) {
    status = "blocked";
    filterReason = "IP Blacklisted";
  } else if (offer.blockBots && isBot(clientUA)) {
    status = "blocked";
    filterReason = "Bot Signature Detected";
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
  } else if (offer.dailyCap > 0 && clicksToday >= offer.dailyCap) {
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
    offer.clickCount += 1;
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
    revenue: status === "passed" ? offer.revenue : 0,
    timestamp: new Date().toISOString()
  };

  db.clicks.unshift(newClick);
  saveDB();

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
// ==========================================
app.post("/api/pixel-track", (req, res) => {
  const { offer_id, pub_id, sub_id1, sub_id2, isp } = req.body;

  if (!offer_id) {
    return res.status(400).json({ error: "Missing offer_id" });
  }

  const offer = db.offers.find(o => o._id === offer_id);
  if (!offer) {
    return res.status(404).json({ error: "Campaign Not Found" });
  }

  const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const userAgentStr = req.headers["user-agent"] || "";
  const ipString = Array.isArray(clientIp) ? clientIp[0] : clientIp;
  const geo = getGeoFromIp(ipString);
  const { device, os, browser } = parseUA(userAgentStr);
  const clientIsp = isp || "Unknown ISP";

  let status: "passed" | "filtered" | "capped" | "blocked" = "passed";

  const today = new Date().toISOString().split('T')[0];
  const clicksToday = db.clicks.filter(c => c.offerId === offer._id && c.timestamp.startsWith(today)).length;

  if (!db.globalTracking) status = "filtered";
  else if (offer.status !== "active") status = "filtered";
  else if (db.blacklist?.includes(ipString)) status = "blocked";
  else if (offer.blockBots && isBot(userAgentStr)) status = "blocked";
  else if (offer.geoTargeting && offer.geoTargeting.length > 0 && !offer.geoTargeting.includes(geo.country)) status = "filtered";
  else if (offer.cityTargeting && offer.cityTargeting.length > 0 && !offer.cityTargeting.includes(geo.city.toUpperCase())) status = "filtered";
  else if (offer.browserTargeting && offer.browserTargeting.length > 0 && !offer.browserTargeting.includes(browser.toUpperCase())) status = "filtered";
  else if (offer.ispTargeting && offer.ispTargeting.length > 0 && !offer.ispTargeting.includes(clientIsp.toUpperCase())) status = "filtered";
  else if (offer.deviceType && offer.deviceType !== "All" && offer.deviceType !== device) status = "filtered";
  else if (offer.osType && offer.osType !== "All" && offer.osType !== os) status = "filtered";
  else if (offer.dailyCap > 0 && clicksToday >= offer.dailyCap) status = "capped";

  if (status !== "passed" && offer.actionOnFilter === "drop") {
    return res.json({ success: true, dropped: true });
  }

  if (status === "passed") offer.clickCount += 1;

  const clickLog: Click = {
    _id: "click-" + Math.random().toString(36).substring(2, 9),
    offerId: offer._id,
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
    revenue: status === "passed" ? offer.revenue : 0,
    timestamp: new Date().toISOString()
  };

  db.clicks.unshift(clickLog);
  saveDB();

  res.json({ success: true, status });
});

// ==========================================
// REAL-TIME TRACKING REDIRECT ENDPOINT
// ==========================================
app.get("/track", (req, res) => {
  const { offer_id, pub_id, sub_id1, sub_id2 } = req.query;

  if (!offer_id) {
    return res.status(400).send("<h1>Error: Missing offer_id</h1>");
  }

  const offer = db.offers.find(o => o._id === offer_id);
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
  let finalUrl = offer.destinationUrl;

  const today = new Date().toISOString().split('T')[0];
  const clicksToday = db.clicks.filter(c => c.offerId === offer._id && c.timestamp.startsWith(today)).length;

  if (!db.globalTracking) status = "filtered";
  else if (offer.status !== "active") status = "filtered";
  else if (db.blacklist?.includes(ipString)) status = "blocked";
  else if (offer.blockBots && isBot(userAgentStr)) status = "blocked";
  else if (offer.geoTargeting && offer.geoTargeting.length > 0 && !offer.geoTargeting.includes(geo.country)) status = "filtered";
  else if (offer.cityTargeting && offer.cityTargeting.length > 0 && !offer.cityTargeting.includes(geo.city.toUpperCase())) status = "filtered";
  else if (offer.browserTargeting && offer.browserTargeting.length > 0 && !offer.browserTargeting.includes(browser.toUpperCase())) status = "filtered";
  else if (offer.ispTargeting && offer.ispTargeting.length > 0 && !offer.ispTargeting.includes(clientIsp.toUpperCase())) status = "filtered";
  else if (offer.deviceType && offer.deviceType !== "All" && offer.deviceType !== device) status = "filtered";
  else if (offer.osType && offer.osType !== "All" && offer.osType !== os) status = "filtered";
  else if (offer.dailyCap > 0 && clicksToday >= offer.dailyCap) status = "capped";

  if (status !== "passed") {
    if (offer.actionOnFilter === "drop") {
      return res.status(403).send("<h1>Request Dropped</h1>");
    } else if (offer.actionOnFilter === "block") {
      const clickLog: Click = {
        _id: "click-" + Math.random().toString(36).substring(2, 9),
        offerId: offer._id,
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
        revenue: 0,
        timestamp: new Date().toISOString()
      };
      db.clicks.unshift(clickLog);
      saveDB();
      return res.status(403).send("<h1>Access Denied</h1>");
    } else if (offer.actionOnFilter === "redirect") {
      finalUrl = offer.fallbackUrl;
    } else if (offer.actionOnFilter === "log") {
      finalUrl = offer.destinationUrl;
    }
  } else {
    offer.clickCount += 1;
  }

  const clickLog: Click = {
    _id: "click-" + Math.random().toString(36).substring(2, 9),
    offerId: offer._id,
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
    revenue: status === "passed" ? offer.revenue : 0,
    timestamp: new Date().toISOString()
  };

  db.clicks.unshift(clickLog);
  saveDB();

  let finalDest = finalUrl
    .replace(/{pub_id}/g, String(pub_id || ""))
    .replace(/{sub_id1}/g, String(sub_id1 || ""))
    .replace(/{sub_id2}/g, String(sub_id2 || ""));

  if (!/^https?:\/\//i.test(finalDest)) {
    finalDest = "http://" + finalDest;
  }

  res.redirect(finalDest);
});

// ==========================================
// VITE MIDDLEWARE INTERACTION (DEV/PROD)
// ==========================================

// Serve public directory for static assets like pixel.js
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
