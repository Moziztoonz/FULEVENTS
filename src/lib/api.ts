import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "./auth";
import { HttpError } from "./errors";
import type { Role, SessionUser } from "./types";

export { HttpError };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Rejects cross-site form posts. Same-origin fetches always send Origin. */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("host");
    if (originUrl.host !== host) {
      throw new HttpError(403, "Request blocked: origin mismatch.");
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(403, "Request blocked: invalid origin.");
  }
}

export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in to continue.");
  if (roles && !roles.includes(user.role)) {
    throw new HttpError(403, "You do not have permission to do that.");
  }
  return user;
}

/**
 * Wraps a route handler so thrown HttpError/ZodError become clean JSON with the
 * right status code. Unexpected errors are logged and reported without leaking
 * internals.
 */
export function route<T extends unknown[]>(
  handler: (request: Request, ...rest: T) => Promise<Response>,
) {
  return async (request: Request, ...rest: T): Promise<Response> => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        assertSameOrigin(request);
      }
      return await handler(request, ...rest);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message, fields: error.fields }, error.status);
      }
      if (error instanceof ZodError) {
        return json(
          {
            error: "Please check the highlighted fields.",
            fields: fieldErrors(error),
          },
          400,
        );
      }
      console.error("[api]", error);
      return json({ error: "Something went wrong on our side. Please try again." }, 500);
    }
  };
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/** Small in-memory limiter. Good enough for a single Node instance. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(429, "Too many attempts. Please wait a moment and try again.");
  }
}

export function clientKey(request: Request, action: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return `${action}:${ip}`;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "We could not read that request. Please try again.");
  }
}
