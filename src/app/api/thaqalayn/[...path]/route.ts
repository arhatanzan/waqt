import { NextResponse } from "next/server";
import { allowedThaqalaynPath, thaqalaynQuery } from "@/lib/api-path";

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const endpoint = path.join("/");

  if (!allowedThaqalaynPath(endpoint)) {
    return NextResponse.json({ error: "Unsupported API endpoint." }, { status: 400 });
  }
  let query: string;
  try {
    query = thaqalaynQuery(endpoint, new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid query." }, { status: 400 });
  }

  try {
    const random = path.at(-1) === "random";
    const response = await fetch(`https://www.thaqalayn-api.net/api/${path.map(encodeURIComponent).join("/")}${query ? `?${query}` : ""}`, {
      ...(random ? { cache: "no-store" as const } : { next: { revalidate: 86400 } }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error("ThaqalaynAPI request failed", endpoint, response.status);
      const status = [400, 404, 429].includes(response.status) ? response.status : 502;
      const error = status === 404 ? "This Thaqalayn book or hadith was not found."
        : status === 429 ? "ThaqalaynAPI's request limit was reached. Please wait a minute and retry."
        : `ThaqalaynAPI is unavailable (${response.status}). Please retry shortly.`;
      const retryAfter = response.headers.get("Retry-After");
      return NextResponse.json({ error }, { status, headers: status === 429 && retryAfter ? { "Retry-After": retryAfter } : undefined });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("ThaqalaynAPI connection failed", endpoint, error);
    return NextResponse.json(
      { error: "Could not reach ThaqalaynAPI. Please retry shortly." },
      { status: 502 }
    );
  }
}
