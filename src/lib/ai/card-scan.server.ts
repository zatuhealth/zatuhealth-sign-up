import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

const schema = z.object({
  entries: z.array(z.object({
    name: z.string(),
    date: z.string().nullable(),
    matched_key: z.string().nullable(),
  })),
});

export type ScannedEntry = { name: string; date: string | null; matchedKey: string | null };

export async function scanVaccinationCard(imageDataUrl: string, catalog: { key: string; name: string }[], signal?: AbortSignal) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI is not configured.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions:
      "You read photos of vaccination cards. List every vaccine dose written on the card with its date. " +
      "Give dates as YYYY-MM-DD, or null if unreadable. For each entry, set matched_key to the key from the catalog " +
      "that is the same vaccine and dose, or null if none matches. Never invent entries that are not on the card.\nCatalog:\n" +
      catalog.map(c => `${c.key}: ${c.name}`).join("\n"),
    messages: [{ role: "user", content: [
      { type: "text", text: "Extract the vaccines and dates from this card." },
      { type: "file", data: new URL(imageDataUrl), mediaType: "image/jpeg" },
    ] }],
    output: Output.object({ schema }),
    ...(signal ? { abortSignal: signal } : {}),
    maxRetries: 0,
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });
  try {
    const out = await result.output;
    const keys = new Set(catalog.map(c => c.key));
    return out.entries.slice(0, 40).map<ScannedEntry>(e => ({
      name: e.name.slice(0, 120),
      date: e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : null,
      matchedKey: e.matched_key && keys.has(e.matched_key) ? e.matched_key : null,
    }));
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) return [];
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 402) throw new Error("AI credits have run out. Please top up to keep scanning cards.");
    if (status === 429) throw new Error("Too many scans right now. Please wait a moment and try again.");
    if (status === 403) throw new Error("Card scanning is not available right now.");
    console.error("card scan failed", err);
    throw new Error("The card could not be read. Please try again.");
  }
}
