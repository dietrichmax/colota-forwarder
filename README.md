# colota-forwarder

Receives location updates from the [Colota](https://colota.app) app and forwards them to multiple services simultaneously — Home Assistant, Dawarich, or any HTTP endpoint.

## How it works

```
Colota app  →  colota-forwarder  →  Home Assistant
                                    →  Dawarich
                                    →  anything else
```

Colota posts a location update to the forwarder. The forwarder responds immediately and fans the payload out to all configured targets in the background, transforming the format for each one as needed.

## Quick start

> **Note:** colota-forwarder is designed to run behind a reverse proxy (Traefik, Caddy, nginx, etc.) that handles TLS. The app binds to `127.0.0.1` by default and has no HTTPS on its own.

**1. Deploy**

```sh
docker compose up -d
```

**2. Configure targets in `.env`**

Copy `.env.example` to `.env` and add your targets. For Home Assistant and Dawarich, set `TARGET_n_TYPE=owntracks` — the forwarder will convert the payload automatically.

```
API_KEY=your-secret-key

# Home Assistant
TARGET_1_URL=http://homeassistant:8123/api/webhook/your-webhook-id
TARGET_1_TYPE=owntracks
# TARGET_1_USER=colota   # optional, default: colota
# TARGET_1_DEVICE=phone  # optional, default: phone

# Dawarich
TARGET_2_URL=http://dawarich:3000/api/v1/points
TARGET_2_TYPE=owntracks
TARGET_2_AUTH=Bearer your-api-key
```

Restart after changing `.env`:
```sh
docker compose up -d --force-recreate
```

**3. Point Colota at the forwarder**

In the Colota app, use the **Custom** or **default Colota** API scheme and set the endpoint to:

```
https://your-server/locations
```

If you set an `API_KEY`, add it in Colota as a custom header: `x-api-key: your-key`

That's it — Colota will forward every location update to all your configured targets.

---

## Target types

Each target has a `TYPE` that controls how the payload is adapted before sending:

| Type | Use for | What it does |
|------|---------|--------------|
| `owntracks` | Home Assistant, Dawarich | Converts to OwnTracks format: adds `_type`/`tid`, converts vel m/s → km/h, `bear` → `cog`, adds `X-Limit-U`/`X-Limit-D` headers |
| `colota` / `raw` | Anything that accepts Colota's native format | Passes payload through unchanged |

## Home Assistant setup

1. In HA go to **Settings → Devices & Services → Add integration → OwnTracks**
2. Copy the generated webhook URL
3. Add it as a target in `.env`:

```
TARGET_1_URL=http://homeassistant:8123/api/webhook/<your-webhook-id>
TARGET_1_TYPE=owntracks
# TARGET_1_USER=colota   # optional, default: colota
# TARGET_1_DEVICE=phone  # optional, default: phone
```

After your first location update, the device tracker will appear in HA as `device_tracker.colota_phone`.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to listen on |
| `API_KEY` | — | If set, requests must include it via `x-api-key` header or `?api_key=` query param |
| `TARGET_n_URL` | — | URL to forward to (n = 1–20) |
| `TARGET_n_TYPE` | `raw` | `owntracks`, `colota`, or `raw` |
| `TARGET_n_AUTH` | — | `Authorization` header value for target n |
| `TARGET_n_TID` | `CL` | Tracker ID for `owntracks` targets |
| `TARGET_n_USER` | `colota` | Device owner username sent to `owntracks` targets |
| `TARGET_n_DEVICE` | `phone` | Device name sent to `owntracks` targets |

Up to 20 targets supported. The server stops reading at the first missing `TARGET_n_URL`.

## Security

- Set a strong `API_KEY` before exposing publicly
- Run behind a reverse proxy (Traefik, Caddy, etc.) with TLS — the app has no HTTPS on its own
- The `compose.yml` binds to `127.0.0.1` by default so the port is not reachable from outside without a proxy
