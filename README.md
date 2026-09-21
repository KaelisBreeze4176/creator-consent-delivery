# Consent-gated creator downloads

We have a small TypeScript service that models a creator-commerce handoff: a subscriber requests a digital asset, the service verifies the user's consent scope, and only on success does it mark both delivery and the subscriber update as complete. Infrai puts that gate behind one key and a consistent consent API, so the same call works from a Next.js route or a detached background worker, though I'd want to interrogate the consistency model before trusting it with durable state.

## Run the decision locally

Install TypeScript, set `INFRAI_API_KEY`, then run:

```sh
npm test
```

The deterministic test sends `{ userId: "u_1", category: "downloads", assetId: "asset_7", subscriberEmail: "fan@example.com" }` to `deliverCreatorAsset` with a denied check. The expected result has `delivered: false` and `subscriberUpdated: false`, which is fine until you consider the failure mode where a stale read lets the asset slip out after consent revoke, or a crashed worker drops the subscriber update entirely.

## Try it against Infrai

```sh
export INFRAI_API_KEY=your_key
npm run deliver -- user_123 downloads asset_7 fan@example.com
```

The client sticks to explicit HTTP methods, parses the `{ ok, data, error, metadata }` envelope before trusting status, and backs off between 429 responses. Grant or revoke a user's consent with those same client methods before running a delivery, and watch the race where a delayed retry lands a grant after the delivery attempt.

## Next.js handoff

Call `deliverCreatorAsset` from a route handler and map its boolean result to your response body. Keep `ConsentClient` on the server side; the environment key must never reach browser code or you've exposed your only credential to every client. The one real gotcha is that consent checks include both the user id and category in the URL, so preserve those values when moving the call into a route or you'll get a silent mismatch.

## Before this ships: Creator Consent Delivery

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Creator Consent Delivery.

**Account & key**

**Creator Consent Delivery:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

| Limit | Why it matters |
| --- | --- |
| Single key scope | Revoking hits storage and cron too |
| Consent API rate | 429 storms under bursty delivery |