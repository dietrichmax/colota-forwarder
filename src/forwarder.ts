import type { Target } from "./targets"
import { transformPayload, type ColotaPayload } from "./transform"
import { maskUrl } from "./utils"

export async function forwardToAll(targets: Target[], payload: ColotaPayload): Promise<void> {
  await Promise.allSettled(
    targets.map(async (target) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (target.auth) headers["Authorization"] = target.auth
        if (target.type === "owntracks") {
          headers["X-Limit-U"] = target.user ?? "colota"
          headers["X-Limit-D"] = target.device ?? "phone"
        }

        const res = await fetch(target.url, {
          method: "POST",
          headers,
          body: JSON.stringify(transformPayload(payload, target)),
          signal: controller.signal,
        })

        if (!res.ok) {
          const text = (await res.text()).slice(0, 200)
          console.warn(`[forwarder] ${maskUrl(target.url)} responded ${res.status}: ${text}`)
        } else {
          console.log(`[forwarder] ${maskUrl(target.url)} responded ${res.status}`)
        }
      } catch (err) {
        console.error(`[forwarder] Failed to reach ${maskUrl(target.url)}:`, err)
      } finally {
        clearTimeout(timeout)
      }
    })
  )
}
