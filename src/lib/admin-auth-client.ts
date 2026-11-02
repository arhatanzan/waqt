import { z } from "zod";

const responseSchema = z.object({
  success: z.boolean(),
  authenticated: z.boolean().optional(),
  message: z.string().optional(),
});

export async function adminSession(
  method: "GET" | "POST" | "DELETE",
  credentials?: { username: string; password: string },
  signal?: AbortSignal,
) {
  const response = await fetch("/api/auth/verify", {
    method,
    cache: "no-store",
    headers: credentials ? { "Content-Type": "application/json" } : undefined,
    body: credentials ? JSON.stringify(credentials) : undefined,
    signal,
  });
  const result = responseSchema.parse(await response.json());
  if (!response.ok || !result.success || typeof result.authenticated !== "boolean") {
    throw new Error(result.message || "Admin authentication failed. Please try again.");
  }
  return result.authenticated;
}
