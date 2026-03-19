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

- **Recommended:** leave `VITE_API_BASE_URL` unset so the app calls same-origin **`/api`**, and configure your web server to **reverse-proxy** `/api` to your backend (e.g. `http://161.97.133.187:8085`).
- **Alternative:** put the API behind **HTTPS** and set `VITE_API_BASE_URL=https://your-api-host`.

See `.env.example`. The app also falls back to `/api` at runtime if it detects HTTPS + an `http://` API URL in the build.
