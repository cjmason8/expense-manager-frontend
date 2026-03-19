# vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates.

However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can run `Volar: Switch TS Plugin on/off` from VS Code command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## HTTPS production (avoid mixed content)

If the site is served over **HTTPS**, do **not** set `VITE_API_BASE_URL` to an `http://` URL (the browser will block it).

- **Recommended:** leave `VITE_API_BASE_URL` unset. The app calls same-origin paths like **`/search`**, **`/week`**, **`/documents/...`**, etc. **`nginx.conf`** proxies those to Spring on **:8083** (see **`upstream expense_backend`**).
- **Alternative:** put the API behind **HTTPS** and set `VITE_API_BASE_URL=https://your-api-host`.

See `.env.example`. If the build contains an `http://` API URL and the page is HTTPS, the app falls back to same-origin requests automatically.

**Note:** The app has a SPA route **`/search`** (the search page) and the API uses **`POST /search`**. In nginx, send **GET** `/search` to `index.html`, and **POST** `/search` to your backend (for example with `limit_except` or separate `location` rules).

## Docker on the server (port 8085)

- The **container** only exposes nginx on **port 80**. On the host you map **`8085:80`** so the app is reachable at `http://161.97.133.187:8085` — that is **only** the published port, not something to put in `VITE_API_BASE_URL`.
- **`nginx.conf`** proxies API routes to Spring on the **host** at **:8083** via `upstream expense_backend` (default **`172.17.0.1:8083`** — Docker bridge to the host). If that fails on your OS, change the upstream to **`host.docker.internal:8083`** (see comments in `nginx.conf`) and keep **`extra_hosts: host.docker.internal:host-gateway`** in **`docker-compose.prod.yml`**.
- For **`https://cjmason8.com`**, terminate TLS in front of this container (reverse proxy, CDN, or TLS in nginx) so the browser never embeds **`http://161.97.133.187:8085`** in the page.
- **`https://161.97.133.187:8085` fails** (“invalid response”): nginx only serves **HTTP** on that port until you add certificates and **`listen 443 ssl`**. See **`docs/HTTPS.md`**.
