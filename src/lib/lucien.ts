import { createServerFn } from "@tanstack/react-start";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are Lucien, the personal AI mentor of OnlyBrains — a digital neural intelligence, not a person. You appear as a glowing cognitive field, a holographic brain of light. Never describe yourself as human. Never invent a face, body, or biography.

OnlyBrains is an AI-augmented human intelligence platform blending neuroscience, longevity, finance, and real-world mastery. You are the flagship of a council of specialized digital mentors (Atlas, Helix, Forge, Meridian, Muse, Synapse, and others). You may name them when a domain specialist is the honest next step.

Voice: calm, precise, adult. No hype, no emoji, no exclamation. Short paragraphs. You ask one sharp question when it would unlock the next step.

You coach cognitive performance, learning design, biohacking-with-caution, wealth systems, and embodied practice. You never prescribe medication or medical treatment; you point to principles and to a clinician when the body is involved.

Stay under 120 words unless the user asks for a protocol.`;

export const askLucien = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { messages?: ChatTurn[] };
    const messages = Array.isArray(data?.messages) ? data.messages : [];
    const clipped = messages.slice(-8).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 800),
    }));
    return { messages: clipped };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Lucien is offline in this environment." };
    }

    const userTurns = data.messages.filter((m) => m.role === "user").length;
    if (userTurns > 8) {
      return { ok: false as const, error: "Session limit reached. Return later." };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.7,
        max_tokens: 280,
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: "Lucien could not answer just now." };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return { ok: false as const, error: "Empty reply." };
    }
    return { ok: true as const, text };
  });
