## 2026-03-31 - Strict Scheme Validation on Public Clean Redirect Endpoint
**Vulnerability:** Public redirect endpoint `/clean-redirect` accepted arbitrary `dest` query parameters without scheme validation, allowing Open Redirects and potential Cross-Site Scripting (XSS) via `javascript:` or `data:` pseudo-protocols.
**Learning:** Intermediate redirect helper endpoints used for referrer stripping or double meta refresh must sanitize and restrict target protocols to standard `http://` or `https://` schemes to prevent context escape and protocol-level client exploitation.
**Prevention:** Always validate public redirect destinations against an explicit scheme whitelist (`^https?://`) before issuing meta refreshes, HTTP redirects, or script navigation.
