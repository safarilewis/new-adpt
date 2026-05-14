import { createHmac } from "crypto";
import { auth } from "@/auth";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function signBackendToken(payload: Record<string, unknown>) {
  const secret = process.env.BACKEND_SESSION_SECRET ?? "dev-secret";
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("You must be signed in to call the backend.");
  }

  const token = signBackendToken({
    sub: session.user.email,
    email: session.user.email,
    name: session.user.name,
    iat: Math.floor(Date.now() / 1000)
  });

  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return parseJsonResponse<T>(response, path);
}

export async function publicFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Public backend request failed with ${response.status}`);
  }
  return parseJsonResponse<T>(response, path);
}

async function parseJsonResponse<T>(response: Response, path: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Backend returned non-JSON for ${path}. Check BACKEND_URL. Received ${response.status} ${contentType}: ${body.slice(0, 120)}`
    );
  }

  return JSON.parse(body) as T;
}
