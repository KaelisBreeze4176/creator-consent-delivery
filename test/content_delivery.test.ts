import { deliverCreatorAsset } from "../src/content_delivery.ts";

const client = { check: async () => ({ granted: false }) } as any;
const result = await deliverCreatorAsset({ userId: "u_1", category: "downloads", assetId: "asset_7", subscriberEmail: "fan@example.com" }, client);
if (result.delivered || result.subscriberUpdated) throw new Error("delivery must stop without consent");
console.log("consent decision test passed");
