# Sentinel's Journal

## 2026-03-05 - Missing Authentication on Sensitive Admin API Endpoints
**Vulnerability:** Critical admin endpoints (`/api/offers`, `/api/stats`, `/api/stats/live`, `/api/clicks`, `/api/conversions`, `/api/publishers`, `/api/blacklist`, `/api/stats/geos`, `/api/stats/performance`, and `/api/simulate`) were exposed publicly without JWT authMiddleware verification. This allowed unauthenticated attackers to scrape sensitive click stream data (including visitor IPs, user agents, and geolocation), read full campaign lists, view platform revenue statistics, and insert simulated click records.
**Learning:** This occurred because although the admin layout was protected on the React frontend, the matching Express backend routes did not declare the `authMiddleware` interceptor in their middleware stack. Security checks must be implemented at the server API layer and cannot rely on frontend client-side path gating.
**Prevention:** Establish a strict route prefix convention (e.g., `/api/admin/*`) or implement automated route scanners in CI that verify all backend management endpoints assert proper authentication/authorization middleware.
