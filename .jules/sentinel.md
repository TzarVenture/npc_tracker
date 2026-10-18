## 2026-03-31 - Script Tag Breakout in HTML Redirect Templates & Unvalidated Redirect Protocols

**Vulnerability:**
The `/clean-redirect` endpoint and HTML redirect execution modes in `server.ts` interpolated URLs directly into inline `<script>` blocks using standard `JSON.stringify` or raw string template literal interpolation. `JSON.stringify` does not escape `<` or `>`, allowing an attacker to inject `</script><script>...` to break out of the script tag and execute arbitrary JS. Furthermore, `/clean-redirect` did not check the destination URL scheme, permitting `javascript:` URIs.

**Learning:**
Standard `JSON.stringify` is insufficient when embedding JSON objects or strings directly inside HTML `<script>` tags, as the browser HTML parser prioritizes closing `</script>` tags over JavaScript string syntax rules.

**Prevention:**
Always escape `<` and `>` as `\u003c` and `\u003e` when stringifying JSON for embedding inside inline HTML `<script>` tags, and enforce strict `http://` / `https://` protocol checks on public redirect target parameters.
