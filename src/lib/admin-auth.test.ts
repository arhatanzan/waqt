import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, POST } from "../app/api/auth/verify/route";
import { adminSession } from "./admin-auth-client";

function request(method = "GET", body?: unknown, cookie?: string, origin?: string) {
  const headers = new Headers();
  if (cookie) headers.set("Cookie", cookie);
  if (origin) headers.set("Origin", origin);
  return new NextRequest("http://localhost:3000/api/auth/verify", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const credentials = { username: "test-admin", password: "test-password-only" };

beforeEach(() => {
  vi.stubEnv("ADMIN_USERNAME", credentials.username);
  vi.stubEnv("ADMIN_PASSWORD", credentials.password);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("admin authentication", () => {
  it("reports missing configuration and never authenticates empty credentials", async () => {
    vi.stubEnv("ADMIN_USERNAME", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    const response = await POST(request("POST", {}));
    expect(response.status).toBe(503);
    expect((await response.json()).message).toContain("not configured");
    expect(response.cookies.get("waqt.admin.session")).toBeUndefined();
    expect((await GET(request())).status).toBe(503);
  });

  it.each([{}, null, { username: 1, password: [] }, { username: "", password: "" }])("rejects malformed credentials: %j", async (body) => {
    expect((await POST(request("POST", body))).status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    const invalid = new NextRequest("http://localhost:3000/api/auth/verify", { method: "POST", body: "{" });
    expect((await POST(invalid)).status).toBe(400);
  });

  it("rejects wrong credentials", async () => {
    const response = await POST(request("POST", { ...credentials, password: "wrong" }));
    expect(response.status).toBe(401);
    expect(response.cookies.get("waqt.admin.session")).toBeUndefined();
  });

  it("creates and validates a signed HTTP-only cookie without including credentials", async () => {
    const response = await POST(request("POST", credentials));
    expect(await response.json()).toEqual({ success: true, authenticated: true });
    const cookie = response.cookies.get("waqt.admin.session");
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "strict", path: "/", maxAge: 28800 });
    expect(cookie?.value).not.toContain(credentials.password);
    expect(await (await GET(request("GET", undefined, `waqt.admin.session=${cookie?.value}`))).json())
      .toEqual({ success: true, authenticated: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects missing, forged, expired, and credential-rotated sessions", async () => {
    vi.useFakeTimers();
    const response = await POST(request("POST", credentials));
    const token = response.cookies.get("waqt.admin.session")!.value;
    for (const value of ["", `${token}forged`, `${token}.extra`]) {
      expect((await (await GET(request("GET", undefined, `waqt.admin.session=${value}`))).json()).authenticated).toBe(false);
    }
    vi.advanceTimersByTime(8 * 60 * 60 * 1000 + 1);
    expect((await (await GET(request("GET", undefined, `waqt.admin.session=${token}`))).json()).authenticated).toBe(false);
    vi.useRealTimers();
    vi.stubEnv("ADMIN_PASSWORD", "changed-password");
    expect((await (await GET(request("GET", undefined, `waqt.admin.session=${token}`))).json()).authenticated).toBe(false);
  });

  it("logs out by clearing the session cookie", async () => {
    const response = await DELETE(request("DELETE"));
    expect(await response.json()).toEqual({ success: true, authenticated: false });
    expect(response.cookies.get("waqt.admin.session")).toMatchObject({ value: "", maxAge: 0 });
  });

  it("rejects cross-origin login and logout", async () => {
    expect((await POST(request("POST", credentials, undefined, "https://other.example"))).status).toBe(403);
    expect((await DELETE(request("DELETE", undefined, undefined, "https://other.example"))).status).toBe(403);
  });

  it("marks production cookies Secure", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(request("POST", credentials));
    expect(response.cookies.get("waqt.admin.session")?.secure).toBe(true);
  });
});

describe("admin session client", () => {
  it("preserves server configuration errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false, message: "Admin login is not configured on this server.",
    }), { status: 503 })));
    await expect(adminSession("POST", credentials)).rejects.toThrow("not configured");
  });

  it("does not accept success without a verified authentication state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))));
    await expect(adminSession("POST", credentials)).rejects.toThrow("authentication failed");
  });

  it("reads server session status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, authenticated: true }))));
    expect(await adminSession("GET")).toBe(true);
  });
});
