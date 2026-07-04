import { NextResponse } from "next/server";
import type { CoachContext } from "@/types";
import { getAIProvider, isRealAIProvider } from "@/lib/ai/provider";
import { buildCoachSystemPrompt } from "@/lib/coach/prompts";
import { generateCoachReply } from "@/lib/coach/engine";

/* ============================================================
   POST /api/coach — vendor-agnostic coaching endpoint.
   The client posts the CoachContext (profile, motivation,
   recent stats, question). With a real AI provider configured
   (AI_PROVIDER=anthropic|openai) the reply comes from the
   model, constrained by the safety prompt; otherwise the
   deterministic rule-based engine answers. API keys stay
   server-side.
   ============================================================ */

export async function POST(req: Request) {
  let ctx: CoachContext;
  try {
    ctx = (await req.json()) as CoachContext;
    if (!ctx?.profile) throw new Error("missing profile");
  } catch {
    return NextResponse.json({ error: "Invalid coach context" }, { status: 400 });
  }

  // Rule-based reply is always computed — it supplies mode/action/challenge
  // even when a model writes the message text.
  const ruleReply = generateCoachReply(ctx);

  if (!isRealAIProvider()) {
    return NextResponse.json({ reply: ruleReply, provider: "mock" });
  }

  try {
    const provider = getAIProvider();
    const message = await provider.complete(
      [
        { role: "system", content: buildCoachSystemPrompt(ctx) },
        { role: "user", content: ctx.userQuestion ?? "Give me my coaching message for today." },
      ],
      { maxTokens: 600, temperature: 0.7 },
    );
    return NextResponse.json({
      reply: { ...ruleReply, message: message || ruleReply.message },
      provider: provider.name,
    });
  } catch (err) {
    // Provider failure falls back to the engine so coaching never breaks.
    console.error("AI provider error:", err);
    return NextResponse.json({ reply: ruleReply, provider: "mock-fallback" });
  }
}
