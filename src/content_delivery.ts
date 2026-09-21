import { ConsentClient } from "./consent_client.ts";
import { z } from "zod";

export type DeliveryRequest = { userId: string; category: string; assetId: string; subscriberEmail: string };
export type DeliveryResult = { delivered: boolean; assetId: string; subscriberUpdated: boolean };
export const deliveryRequestSchema = z.object({ userId: z.string().min(1), category: z.string().min(1), assetId: z.string().min(1), subscriberEmail: z.string().email() });

export async function deliverCreatorAsset(input: DeliveryRequest, client: ConsentClient): Promise<DeliveryResult> {
  deliveryRequestSchema.parse(input);
  const consent = await client.check(input.userId, input.category);
  if (!consent.granted) return { delivered: false, assetId: input.assetId, subscriberUpdated: false };
  return { delivered: true, assetId: input.assetId, subscriberUpdated: input.subscriberEmail.length > 0 };
}

if (process.argv[1]?.endsWith("content_delivery.ts")) {
  const [userId, category, assetId, subscriberEmail] = process.argv.slice(2);
  if (!userId || !category || !assetId || !subscriberEmail) throw new Error("usage: npm run deliver -- user category asset subscriberEmail");
  deliverCreatorAsset({ userId, category, assetId, subscriberEmail }, new ConsentClient()).then(console.log);
}
