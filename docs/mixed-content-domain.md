# Still seeing “Mixed Content” with `http://161.97.133.187:8085`

**If your registrar only shows a forward to `http://161.97.133.187` (no port):** that is **port 80**. Your Docker app is on **8085** — see **`docs/url-forwarding-and-ports.md`** for why those differ and where **:8085** can appear.

---

# Still seeing “Mixed Content” with `http://161.97.133.187:8085`

## What the browser is complaining about

**Mixed content** means: the **HTML page** was loaded with **`https://`**, but something (script, XHR, iframe, redirect) tries to load **`http://161.97.133.187:8085`**. Browsers block that.

So **somewhere** you are on **HTTPS** while something still uses that **HTTP** URL.

## Common cause: domain / DNS “forwarding”

Many registrars offer **“forward domain to URL”** or **“masking”** / **iframe**:

- Visitor opens **`https://cjmason8.com`** (provider adds free HTTPS).
- The page is actually an **HTTPS wrapper** that **embeds** or **redirects** to **`http://161.97.133.187:8085`**.
- Result: **HTTPS page** + **HTTP** sub-resource → **mixed content**.

**Fix:** Do **not** use “URL forwarding” / “masked forward” to `http://161.97.133.187:8085`.

Use a normal **DNS A record**:

| Type | Name | Value           |
|------|------|-----------------|
| A    | `@`  | `161.97.133.187` |
| A    | `www`| `161.97.133.187` (optional) |

Then:

- Either users open **`http://cjmason8.com:8085`** if you only publish **8085** (and accept HTTP until you add TLS), **or**
- You put **nginx/Caddy/Cloudflare** in front: **`https://cjmason8.com`** → proxy to **`http://127.0.0.1:8085`** (your Docker). The browser only talks **HTTPS** to the proxy; it **never** sees `http://161.97.133.187:8085` in the page.

## Checklist

1. **Hard refresh** / **clear site data** (old JS bundle might still contain `http://…`).
2. **DevTools → Network**: find the **blocked** request; note **Initiator** (which file/line).
3. **DevTools → Application → Service Workers**: unregister if any.
4. Confirm **no** `VITE_API_BASE_URL=http://…` in the **Docker build** (no `.env.production` in image with that line, no CI env injecting it).
5. This app expects **relative** API paths (`/week`, `/search`, …) on the **same host** as the SPA so nginx can proxy them.

## What we do in code

- `resolveApiBaseUrl()` drops an **`http://…` `VITE_API_BASE_URL`** when the page is **HTTPS**, so API calls stay **same-origin**.
- `00.axios-baseurl.ts` sets **`axios.defaults.baseURL`** to the same value.

If mixed content **still** names `http://161.97.133.187:8085`, the request is usually **not** from our axios base (e.g. **iframe**, **provider page**, or **cached old bundle**). Use the Network tab to see the initiator.
