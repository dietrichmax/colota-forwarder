# colota-forwarder

Receives location updates from the [Colota](https://colota.app) app and forwards them to multiple services at once — Home Assistant, Dawarich, GeoPulse, Traccar, Reitti, or any HTTP endpoint.


```
Colota app  →  colota-forwarder  →  Home Assistant
                                 →  Dawarich
                                 →  anything else
```

The forwarder responds to Colota immediately and fans the update out to all targets in the background, converting the format for each service as needed.

## Setup

**1. Create a `compose.yml`**

```yaml
services:
  colota-forwarder:
    image: mxdcodes/colota-forwarder:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file: .env
    read_only: true
    security_opt:
      - no-new-privileges:true
    mem_limit: 128m
    cpus: "0.5"
```

**2. Create a `.env` file**

Copy `.env.example` to `.env` and fill in your targets:

```
API_KEY=your-secret-key

TARGET_1_URL=http://homeassistant:8123/api/webhook/your-webhook-id
TARGET_1_TYPE=owntracks

TARGET_2_URL=https://dawarich.example.com/api/v1/owntracks/points?api_key=your-key
TARGET_2_TYPE=owntracks
```

Targets are read in order starting at 1. If a number is skipped, everything after it is ignored.

**3. Start**

```sh
docker compose up -d
```

**4. Point Colota at the forwarder**

In the app, set the endpoint to `https://your-server/locations`. If you set an `API_KEY`, add `x-api-key: your-key` as a custom header in the app.

## Integrations

### Home Assistant

Go to **Settings → Devices & Services → Add integration → OwnTracks**, copy the webhook URL, then:

```
TARGET_1_URL=http://homeassistant:8123/api/webhook/your-webhook-id
TARGET_1_TYPE=owntracks
# TARGET_1_USER=colota   # default: colota — used in the entity name
# TARGET_1_DEVICE=phone  # default: phone  — used in the entity name
```

The device tracker shows up as `device_tracker.colota_phone` after the first update.

### Dawarich

```
TARGET_2_URL=https://dawarich.example.com/api/v1/owntracks/points?api_key=your-key
TARGET_2_TYPE=owntracks
```

### GeoPulse

```
TARGET_3_URL=https://geopulse.example.com/api/colota
TARGET_3_TYPE=geopulse
```

### Traccar

```
TARGET_4_URL=https://traccar.example.com:5055
TARGET_4_TYPE=traccar
# TARGET_4_TID=colota  # device ID in Traccar, default: colota
```

### Reitti

```
TARGET_5_URL=https://reitti.example.com/api/v1/ingest/owntracks?token=your-reitti-token
TARGET_5_TYPE=owntracks
```

### OwnTracks Recorder

OwnTracks Recorder uses the same format and headers as the HA integration, so `TYPE=owntracks` works:

```
TARGET_5_URL=http://recorder:8083/pub
TARGET_5_TYPE=owntracks
```

## Target types

| Type | Use for | Notes |
|------|---------|-------|
| `owntracks` | Home Assistant, Dawarich, Reitti, OwnTracks Recorder | Converts to OwnTracks format, adds `X-Limit-U`/`X-Limit-D` headers |
| `geopulse` | GeoPulse | Passes Colota payload unchanged |
| `traccar` | Traccar | HTTP GET with OsmAnd protocol field names |
| `colota` / `raw` | Custom endpoints | Passes payload unchanged |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to listen on |
| `API_KEY` | — | If set, requests must include it via `x-api-key` header or `?api_key=` |
| `TARGET_n_URL` | — | Forward destination (n = 1–20, must be consecutive) |
| `TARGET_n_TYPE` | `raw` | `owntracks`, `geopulse`, `traccar`, `colota`, or `raw` |
| `TARGET_n_AUTH` | — | Full `Authorization` header value (e.g. `Bearer your-token`) |
| `TARGET_n_TID` | `CL` | Tracker ID for `owntracks` / device ID for `traccar` |
| `TARGET_n_USER` | `colota` | `X-Limit-U` header for `owntracks` targets |
| `TARGET_n_DEVICE` | `phone` | `X-Limit-D` header for `owntracks` targets |

## Security

Set a strong `API_KEY` before exposing the forwarder publicly. Run it behind a reverse proxy (Traefik, Caddy, etc.) that handles TLS. The app has no HTTPS on its own. The `compose.yml` binds to `127.0.0.1` so the port isn't reachable from outside without a proxy.
