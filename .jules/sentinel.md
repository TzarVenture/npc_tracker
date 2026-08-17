# Sentinel Security Journal

## 2026-08-17 - Escaping JSON in HTML script blocks and validating clean-redirect URLs
**Vulnerability:** Standard `JSON.stringify` inside HTML `<script>` tags does not escape `<` or `>`, allowing attacker-controlled URLs/strings to inject closing `</script>` tags or inline JS. Additionally, `/clean-redirect` lacked URL scheme validation, allowing `javascript:`/`data:` protocol schemes or open redirects.
**Learning:** Inlining dynamic data into `<script>` responses requires escaping HTML-sensitive characters (`<`, `>`, `&`, `\u2028`, `\u2029`). Clean redirect endpoints must strictly validate destination schemes (`http://` or `https://`).
**Prevention:** Always use `safeJsonStringify` when serializing values into HTML `<script>` blocks and enforce strict protocol regex checks (`/^https?:\/\//i`) on user-supplied redirect destinations.
