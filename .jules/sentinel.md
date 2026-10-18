# Sentinel Security Journal

## 2026-03-29 - Reflected XSS & Open Redirect via Unsanitized Redirection Parameters
**Vulnerability:** The public redirection endpoint `/clean-redirect` and `executeRedirect` helper embedded user-controllable URLs directly into HTML `<script>` tags using standard `JSON.stringify()`. An attacker could pass payloads containing `</script><script>...` to break out of the script context and execute arbitrary JavaScript. Furthermore, `/clean-redirect` did not enforce `http://` or `https://` protocol schemes, allowing `javascript:` or `data:` URL execution or arbitrary external redirects.
**Learning:** Standard `JSON.stringify()` does not escape `<` or `>` characters by default. When outputting JSON inside inline `<script>` tags in Express/HTML templates, closing tags (e.g. `</script>`) will be parsed by the browser HTML parser prior to JS execution.
**Prevention:** Use a dedicated escaping function like `safeJsonStringify` (`JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')`) whenever embedding JSON in HTML `<script>` tags, and strictly validate redirect target URLs to begin with `http://` or `https://`.
