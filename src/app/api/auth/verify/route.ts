import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const COOKIE = "waqt.admin.session";
const SESSION_SECONDS = 8 * 60 * 60;
const credentialsSchema = z.object({
  username: z.string().min(1).max(1000),
  password: z.string().min(1).max(1000),
});

function configuration() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;
  const secret = createHash("sha256").update(JSON.stringify([username, password])).digest();
  return { username, password, secret };
}

function equal(left: string, right: string) {
  return timingSafeEqual(
    createHash("sha256").update(left).digest(),
    createHash("sha256").update(right).digest(),
  );
}

function reply(body: { success: boolean; authenticated?: boolean; message?: string }, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function unavailable() {
  return reply({
    success: false,
    message: "Admin login is not configured on this server. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.local for local development, or in your deployment environment, then restart or redeploy.",
  }, 503);
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const config = configuration();
  if (!config) return unavailable();
  const token = request.cookies.get(COOKIE)?.value ?? "";
  const [expires, nonce, signature, extra] = token.split(".");
  const expected = createHmac("sha256", config.secret).update(`${expires}.${nonce}`).digest("hex");
  const authenticated = !extra && !!nonce && !!signature
    && Number(expires) > Date.now() && equal(signature, expected);
  return reply({ success: true, authenticated });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ success: false, message: "Invalid request origin." }, 403);
  const config = configuration();
  if (!config) return unavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ success: false, message: "Enter a valid username and password." }, 400);
  }
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) return reply({ success: false, message: "Enter a valid username and password." }, 400);
  const usernameMatches = equal(parsed.data.username, config.username);
  const passwordMatches = equal(parsed.data.password, config.password);
  if (!usernameMatches || !passwordMatches) {
    return reply({ success: false, message: "Invalid username or password." }, 401);
  }

  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${randomBytes(24).toString("hex")}`;
  const signature = createHmac("sha256", config.secret).update(payload).digest("hex");
  const response = reply({ success: true, authenticated: true });
  response.cookies.set(COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ success: false, message: "Invalid request origin." }, 403);
  const response = reply({ success: true, authenticated: false });
  response.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
