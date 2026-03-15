import type { Target } from "./targets"

export interface ColotaPayload {
  lat: number
  lon: number
  acc: number
  batt: number
  bs: number
  tst: number
  alt?: number
  vel?: number  // m/s
  bear?: number
}

export function transformPayload(payload: ColotaPayload, target: Target): Record<string, unknown> {
  switch (target.type) {
    case "owntracks":
      return {
        _type: "location",
        tid: target.tid ?? "CL",
        lat: payload.lat,
        lon: payload.lon,
        tst: payload.tst,
        acc: payload.acc,
        batt: payload.batt,
        bs: payload.bs,
        ...(payload.alt !== undefined && { alt: payload.alt }),
        ...(payload.vel !== undefined && { vel: payload.vel }),
        // OwnTracks uses "cog" for bearing
        ...(payload.bear !== undefined && { cog: payload.bear }),
      }
    case "traccar":
      return {
        id: target.tid ?? "colota",
        lat: payload.lat,
        lon: payload.lon,
        accuracy: payload.acc,
        timestamp: payload.tst,
        batt: payload.batt,
        charge: payload.bs,
        ...(payload.alt !== undefined && { altitude: payload.alt }),
        ...(payload.vel !== undefined && { speed: payload.vel }),
        ...(payload.bear !== undefined && { bearing: payload.bear }),
      }
    default:
      return { ...payload }
  }
}
