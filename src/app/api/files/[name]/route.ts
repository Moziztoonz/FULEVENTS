import fs from "node:fs/promises";
import path from "node:path";
import { contentTypeFor, uploadRoot } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const safe = path.basename(name);
  if (!/^[a-zA-Z0-9._-]+$/.test(safe)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const file = await fs.readFile(path.join(uploadRoot, "events", safe));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypeFor(safe),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
