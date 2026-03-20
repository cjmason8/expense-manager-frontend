# URL forwarding to `http://161.97.133.187` — where does **:8085** come from?

## Default HTTP port

When a URL has **no port**, the browser uses:

- **`http://…`** → **port 80**
- **`https://…`** → **port 443**

So **`http://161.97.133.187`** is the same as **`http://161.97.133.187:80`**.

It is **not** the same as **`http://161.97.133.187:8085`**.

## Where **8085** comes from (your setup)

In **`docker-compose.prod.yml`** you map:

```yaml
ports:
  - "8085:80"
```

That means:

- **Inside** the container, nginx listens on **80**.
- **On the server**, that is published as **8085**.

So the expense-manager UI is only reachable on the public IP as:

```text
http://161.97.133.187:8085
```

unless you add something else (see below).

**This repo’s Vue app does not append `:8085`.** The port appears only when:

1. You (or a doc) use the full URL including **`:8085`**, or  
2. Your registrar has a **“destination port” / “forward to port”** field set to **8085** (some panels hide this unless you expand advanced settings), or  
3. Something listening on **port 80** on that machine sends an **HTTP redirect** to **`:8085`**, or  
4. An old **cached** page / **service worker** / **bookmark** still used `:8085`.

## Mismatch: forward to IP with no port vs Docker on 8085

If the domain **only** forwards to **`http://161.97.133.187`** (port **80**):

- Traffic goes to **port 80** on the VPS.
- Your **Docker** app is on **8085**, not 80.
- So you either get **nothing on 80**, **another site** on 80, or **a redirect** (sometimes to 8085).

To make forwarding line up with Docker **without** putting `:8085` in the URL, you typically:

1. Run a small **reverse proxy on port 80** on the host that proxies to **`http://127.0.0.1:8085`**, **or**  
2. Change Docker to publish **`80:80`** (only if port 80 is free on the host), **or**  
3. Stop using URL forwarding and use a **DNS A record** + the same proxy on 80/443.

## Recommendation

Avoid **URL forwarding** to a raw `http://` IP for a serious app. Use:

- **A record** → `161.97.133.187`  
- **Nginx/Caddy** on the host on **80** (and **443** for HTTPS) → `proxy_pass http://127.0.0.1:8085;`

Then the browser only talks to **`https://cjmason8.com`** (or `http://` on 80), and **:8085** never appears in the address bar or in mixed-content errors.
