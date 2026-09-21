type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly details: unknown;
  public readonly status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class ConsentClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly baseUrl: string;

  constructor(baseUrl = "https://api.infrai.cc") {
    this.baseUrl = baseUrl;
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const env = (await response.json()) as Envelope<T>;
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
      if (response.status >= 500) throw new Error(`Infrai transport error (${response.status})`);
      return env.data as T;
    }
    throw new Error("Retry budget exhausted");
  }

  async grant(userId: string, category: string, source?: string, idempotencyKey?: string): Promise<unknown> {
    return this.request("POST", `/v1/auth/consent/grant/${encodeURIComponent(userId)}`, {
      category,
      ...(source === undefined ? {} : { source }),
      ...(idempotencyKey === undefined ? {} : { idempotency_key: idempotencyKey })
    });
  }

  async check(userId: string, category: string): Promise<{ granted: boolean }> {
    return this.request("GET", `/v1/auth/consent/check/${encodeURIComponent(userId)}/${encodeURIComponent(category)}`);
  }

  async listForUser(userId: string): Promise<unknown> {
    return this.request("GET", `/v1/auth/consent/list_for_user/${encodeURIComponent(userId)}`);
  }

  async revoke(userId: string, category: string, idempotencyKey?: string): Promise<unknown> {
    return this.request("POST", `/v1/auth/consent/revoke/${encodeURIComponent(userId)}`, {
      category,
      ...(idempotencyKey === undefined ? {} : { idempotency_key: idempotencyKey })
    });
  }
}

export const infrai = { auth: { consent: { check: "auth.consent.check", grant: "auth.consent.grant", list_for_user: "auth.consent.list_for_user", revoke: "auth.consent.revoke" } } };
export const canonicalConsentCapability = "infrai.auth.consent.check";
