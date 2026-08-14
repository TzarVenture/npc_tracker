# Sentinel Security Journal

## 2026-08-14 - Reflected XSS and open redirect in clean-redirect endpoint
**Vulnerability:** The `/clean-redirect` endpoint accepted a user-controlled `dest` query parameter and directly interpolated it inside a `<script>` tag via `JSON.stringify(dest)` and a `<meta>` refresh attribute via `encodeURI(dest)`. Because `JSON.stringify` does not escape `</script>` tags, an attacker could supply `</script><script>alert(1)</script>` to execute arbitrary JavaScript (Reflected XSS). Furthermore, an attacker could supply `javascript:...` or external URLs, leading to DOM XSS and open redirects.
**Learning:** Standard JSON stringification (`JSON.stringify`) inside an HTML script block is parsed by the browser's HTML parser before JavaScript decoding. Therefore, closing HTML tags like `</script>` are processed immediately, breaking out of JS string literals and enabling script injection. Additionally, unvalidated public redirect endpoints can be abused for open redirects and client-side JavaScript execution via `javascript:` protocols.
**Prevention:**
1. Avoid raw string interpolation of user input directly inside HTML templates and script blocks.
2. Use a secure JSON serializer (`safeJsonStringify`) that replaces `<`, `>`, `/`, and line terminators with safe Unicode escapes (`\u003c`, `\u003e`, `\/`, `\u2028`, `\u2029`).
3. Enforce strict URL scheme validation (e.g., matching `/^https?:\/\//i`) on any public redirect or proxy parameters.
