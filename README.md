# NPC Tracker (NPC_tracker)

NPC Tracker is an enterprise-grade, full-stack retargeting traffic controller and real-time analytics platform. It features dynamic routing, rule-based traffic filtering, bot protection, live click-stream monitoring, conversion attribution, and a fully featured admin dashboard.

The application is built using a modern **TypeScript** stack, leveraging **Vite** and **React** on the frontend, and **Express** with **SQLite** (via `better-sqlite3`) on the backend.

---

## 🚀 Key Features

*   **Real-Time Redirect & Routing Engine (`/track`):** Dynamically filters, routes, and logs incoming traffic based on rule-based campaigns.
*   **Dynamic Client-Side Tracking (`/api/script/:offerId.js`):** Generates specialized browser integration scripts with target page matching, delay triggers, and custom frequency caps (`once_per_session`, `once_per_user`).
*   **Intelligent Traffic Filtering:**
    *   **Geo-Targeting:** Restrict traffic by Country and City using `geoip-lite`.
    *   **Device & OS Constraints:** Target specific devices (Mobile, Desktop, Tablet) and operating systems (iOS, Android, Windows, macOS, Linux).
    *   **Browser & ISP Filtering:** Restrict access to specific user agents or Internet Service Providers.
    *   **Rate Limiting & Caps:** Enforce Hourly and Daily click-stream limits.
    *   **Duplicate Click Window:** Filter repeated clicks from the same IP within a configurable time window.
    *   **Bot Detection:** Automatically identify and block search engines, crawlers, and scrapers.
*   **Multi-Event Conversion Postback Engine (`/api/postback`):** Attributes conversions to click IDs with custom event naming, flexible payout and revenue models, and conversion duplicate prevention.
*   **Comprehensive Live Dashboard & Analytics:**
    *   Visual performance monitoring charts (hourly clicks, revenue, filtered vs passed).
    *   Live click stream with detailed logging (IP, OS, browser, country, city, ISP, status, filter reasons).
    *   Publisher-specific conversion tracking and detailed breakdowns.
    *   Server-side CSV exports of filtered click data.
*   **Robust Security:** Fully secured API endpoints using JSON Web Token (JWT) authorization, IP blacklisting tools, and global tracking overrides.

---

## 🛠️ Technology Stack

*   **Frontend:**
    *   React 19
    *   React Router v7
    *   Vite 6 (with middleware integration in development)
    *   Tailwind CSS v4 (with `@tailwindcss/vite`)
    *   Lucide React (Icons)
    *   Recharts (Interactive Analytics Charts)
    *   Motion / Framer Motion (Transitions)
*   **Backend:**
    *   Node.js (TypeScript with `tsx`)
    *   Express
    *   better-sqlite3 (High-performance WAL-enabled SQLite database layer)
    *   jsonwebtoken & bcryptjs (Security & JWT Auth)
    *   geoip-lite (Country & City lookup)
*   **Tooling:**
    *   esbuild (Production server bundling)
    *   TypeScript (Type checking)

---

## 📂 Project Structure

```text
├── src/                        # Frontend React Application
│   ├── components/             # React Shared Components
│   │   └── ui/                 # Core UI Elements (Badge, Button, Card, etc.)
│   ├── pages/                  # Main Workspace Views
│   │   ├── Dashboard.tsx       # Live charts, quick stats, geo-analytics
│   │   ├── Offers.tsx          # Campaign creation & management
│   │   ├── Filters.tsx         # Live Click Stream & Search filters
│   │   ├── Reports.tsx         # Conversions and Postback tracking
│   │   ├── Publishers.tsx      # Publisher breakdowns & publisher details
│   │   ├── Settings.tsx        # IP Blacklist management & global settings
│   │   └── Login.tsx           # Authentication page
│   ├── App.tsx                 # App layout, router & navigation
│   ├── index.css               # Tailwind CSS entrypoint
│   ├── main.tsx                # React mount entrypoint
│   └── types.ts                # TypeScript types & models
├── authMiddleware.ts           # Express JWT Authentication Middleware
├── db.ts                       # database operations & better-sqlite3 queries
├── server.ts                   # Main Express application, API router & tracking pipeline
├── tsconfig.json               # TypeScript compiler config
├── vite.config.ts              # Vite configuration with Tailwind CSS v4 support
└── metadata.json               # Project application metadata
```

---

## ⚙️ Environment Variables

The application can be configured by creating a `.env` file in the root directory. Copy `.env.example` as a starting point:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the server will run on | `3000` |
| `JWT_SECRET` | Secret key used to sign and verify JWT authentication tokens | `npc_tracker_jwt_secret_key_2026` |
| `ADMIN_PASSWORD` | The default password generated for the `admin` user on initial database setup | `Admin@123456` |
| `GEMINI_API_KEY` | (Optional) Required for Gemini AI features | - |
| `APP_URL` | The public-facing URL of the application (useful for pixel endpoints) | - |

---

## 💾 Database Layer

The database uses **SQLite** (`tracker.sqlite`) powered by **`better-sqlite3`**.
For optimum concurrent read and write performance, **WAL (Write-Ahead Logging)** mode is enabled.
Key tables and structural indices are:
*   `admin_users`: Manages admin user accounts and credentials.
*   `offers`: Storage for campaigns, filters, scheduling, caps, and script behaviors.
*   `clicks`: Real-time logging of visitor attributes, geo-location, publisher details, and filter outcome.
*   `conversions`: Conversion attribution tracking.
*   `blacklist`: Keeps banned IPs.
*   `system_settings`: Dynamic system configurations (e.g. global tracking toggles).

---

## 🛣️ API & Tracking Routes Reference

### Public Tracking Routes

#### Real-Time Tracking Link
*   **Endpoint:** `GET /track`
*   **Parameters:** `offer_id` (required), `pub_id`, `sub_id1`, `sub_id2`
*   **Purpose:** The entry point for live campaigns. Evaluates traffic filters, logs the click as `passed`, `filtered`, `capped`, or `blocked`, performs parameter replacements (`{pub_id}`, `{sub_id1}`, `{sub_id2}`) and performs a `302` redirect to the destination or fallback URL.

#### Dynamic JS Snippet
*   **Endpoint:** `GET /api/script/:offerId.js`
*   **Purpose:** Delivers a dynamic integration script for web property tracking. Matches paths, respects delay/interval timings, tracks session-level or user-level limits, and issues callback pixel posts.

#### Client-Side Pixel Callback
*   **Endpoint:** `POST /api/pixel-track`
*   **Purpose:** Endpoint reached by the tracking snippet to record impressions.

#### Conversion / Postback Tracker
*   **Endpoint:** `GET /api/postback`
*   **Parameters:** `click_id` (required), `payout`, `revenue`, `event`
*   **Purpose:** Used by affiliate networks or external platforms to fire conversions. Automatically credits revenue, prevents double-conversions, and attributes metrics back to the originating campaign.

---

### Admin API Endpoints (Protected by JWT)

All admin API endpoints except login routes require an `Authorization: Bearer <token>` or `x-access-token` header.

#### Authentication
*   `POST /api/auth/login` - Authenticate admin credentials and retrieve a JWT token.
*   `GET /api/auth/me` - Validates session token and returns active administrator user details.

#### Campaign Management (CRUD)
*   `GET /api/offers` - Fetch all campaigns.
*   `POST /api/offers` - Create a new campaign.
*   `PUT /api/offers/:id` - Update campaign variables and targeting configurations.
*   `DELETE /api/offers/:id` - Delete campaign, and delete its clicks and conversions log.

#### Stats & Reporting
*   `GET /api/stats` - Fetch overall workspace analytics (Total clicks, revenue, conversion rate).
*   `GET /api/stats/live` - Fetch latest live clicks (defaults to 20).
*   `GET /api/stats/geos` - Geo-analytics distribution.
*   `GET /api/stats/performance` - Hourly performance buckets.
*   `GET /api/publishers` - Retrieve performance segmented by publisher IDs.
*   `GET /api/clicks` - Paginated and filtered click query endpoint.
*   `GET /api/conversions` - Paginated conversion log query endpoint.
*   `GET /api/clicks/export` - Export current filtered view as a server-side generated CSV file.

#### System Settings
*   `GET /api/global-tracking` - Retrieve global tracking state.
*   `POST /api/global-tracking` - Activate or deactivate global redirect processing.
*   `GET /api/blacklist` - Retrieve blacklisted IPs.
*   `POST /api/blacklist` - Add an IP to the blacklist database.
*   `DELETE /api/blacklist/:ip` - Remove an IP from the blacklist database.

---

## 🏁 Getting Started

### 📦 Installation

Ensure you have Node.js (v18+ recommended) installed, and install project dependencies:

```bash
npm install
```

### 💻 Running in Development

In development mode, Vite's dev server runs as a middleware inside the Express server so that hot module reloading works alongside the live API.

To run the unified server:

```bash
npm run dev
```

The application will be running locally at **`http://localhost:3000/`**.
Login with the default credentials:
*   **Username:** `admin`
*   **Password:** `Admin@123456` *(unless overwritten in your `.env` file)*

---

## 📦 Building for Production

### 1. Build the Frontend Assets and Bundle the Server:
```bash
npm run build
```
This script runs the `vite build` command to output static client-side files to the `dist` folder, and uses `esbuild` to bundle `server.ts` into a fast, single-file CommonJS module located at `dist/server.cjs`.

### 2. Start the Production Server:
```bash
npm start
```
The production server runs completely self-contained from the built `dist` bundle.
