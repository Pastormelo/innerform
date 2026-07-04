/* ============================================================
   AI provider abstraction. Server-side only — API keys never
   reach the client. Swap providers via AI_PROVIDER env var.

   To wire a real provider:
   1. Set AI_PROVIDER=anthropic (or openai) and the matching key
      in .env.local (ANTHROPIC_API_KEY / OPENAI_API_KEY).
   2. The route handlers in app/api/* call getAIProvider() and
      stay vendor-agnostic.
   ============================================================ */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  readonly name: string;
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
}

/** Anthropic (Claude). Uses fetch directly to avoid an SDK dependency until needed. */
class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  constructor(private apiKey: string, private model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5") {}

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const rest = messages.filter((m) => m.role !== "system");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        system: system || undefined,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  }
}

/** OpenAI-compatible chat completions. */
class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  constructor(private apiKey: string, private model = process.env.OPENAI_MODEL ?? "gpt-4o") {}

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

/** Mock provider — MVP default. Deterministic, no network, no keys. */
class MockProvider implements AIProvider {
  readonly name = "mock";
  async complete(): Promise<string> {
    // The coach service uses the rule-based engine directly when the
    // provider is mock; this exists so calling code never branches.
    return "";
  }
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "mock";
  switch (provider) {
    case "anthropic": {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error("AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set");
      return new AnthropicProvider(key);
    }
    case "openai": {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("AI_PROVIDER=openai but OPENAI_API_KEY is not set");
      return new OpenAIProvider(key);
    }
    default:
      return new MockProvider();
  }
}

export function isRealAIProvider(): boolean {
  return (process.env.AI_PROVIDER ?? "mock") !== "mock";
}
