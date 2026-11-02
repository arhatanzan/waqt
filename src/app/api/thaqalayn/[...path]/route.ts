import { NextResponse } from "next/server";
import { allowedThaqalaynPath } from "@/lib/api-path";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const endpoint = path.join("/");

  if (!allowedThaqalaynPath(endpoint)) {
    return NextResponse.json({ error: "Unsupported API endpoint." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://www.thaqalayn-api.net/api/${endpoint}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error("ThaqalaynAPI request failed", endpoint, response.status);
      return NextResponse.json(
        { error: `ThaqalaynAPI is unavailable (${response.status}). Please retry shortly.` },
        { status: 502 }
      );
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

