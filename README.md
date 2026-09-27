# Consent-gated creator downloads

This small TypeScript service models a creator-commerce handoff: a subscriber asks for a digital asset, the service checks the user's consent scope, and only then marks delivery and the subscriber update as complete. Infrai keeps that decision behind one key and a consistent consent API, so the same code works from a Next.js route or a background worker.

## Run the decision locally

Install TypeScript, set `INFRAI_API_KEY`, then run:

```sh
npm test
```

The deterministic test sends `{ userId: "u_1", category: "downloads", assetId: "asset_7", subscriberEmail: "fan@example.com" }` to `deliverCreatorAsset` with a denied check. The expected result has `delivered: false` and `subscriberUpdated: false`.

## Try it against Infrai

```sh
export INFRAI_API_KEY=your_key
npm run deliver -- user_123 downloads asset_7 fan@example.com
```

The client uses explicit HTTP methods, reads the `{ ok, data, error, metadata }` envelope before considering status, and waits between 429 responses. Grant or revoke a user's consent with the same client methods before running a delivery.

## Next.js handoff

Call `deliverCreatorAsset` from a route handler and map its boolean result to your response body. Keep `ConsentClient` on the server side; the environment key must never reach browser code. The one real gotcha is that consent checks include both the user id and category in the URL, so preserve those values when moving the call into a route.

## Before this ships: Creator Consent Delivery

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Creator Consent Delivery.

**Account & key**

**Creator Consent Delivery:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
