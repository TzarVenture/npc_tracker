# Sentinel Security Journal

## 2026-08-11 - Open Redirect and XSS in Double Meta Refresh Clean-Redirect Helper
**Vulnerability:** The `/clean-redirect` endpoint accepted an arbitrary `dest` URL parameter without verification, causing an Open Redirect vulnerability. Furthermore, it did not strictly validate the URL protocol (allowing `javascript:` URLs) and didn't escape `<` characters, risking Cross-Site Scripting (XSS).
**Learning:** Even internal helper redirection endpoints designed to protect user privacy (such as stripping referrers with double meta-refresh) can be abused as open redirectors or XSS injection points if they accept arbitrary user input on public routes.
**Prevention:** Always validate URL schemes (strictly requiring `http:` or `https:`) and cryptographically sign internal transition parameters (using HMAC with a server-side JWT/secret key) to ensure the destination URL was produced by the system itself.
