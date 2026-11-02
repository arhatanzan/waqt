import { NextResponse } from "next/server";
import { allowedPath } from "@/lib/api-path";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const endpoint = path.join("/");
  if (!allowedPath(endpoint)) return NextResponse.json({ error: "Unsupported API endpoint." }, { status: 400 });
  const key = process.env.QURAN_API || process.env.UMMAH_API_KEY || process.env.NEXT_PUBLIC_UMMAH_API_KEY;
  try {
    const response = await fetch(`https://ummahapi.com/api/${endpoint}`, {
      headers: key ? { "X-API-Key": key } : {},
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      console.error("UmmahAPI request failed", endpoint, response.status);
      return NextResponse.json({ error: `UmmahAPI is unavailable (${response.status}). Please retry shortly.` }, { status: 502 });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("UmmahAPI connection failed", endpoint, error);
    return NextResponse.json({ error: "Could not reach UmmahAPI. Please retry shortly." }, { status: 502 });
  }
}
