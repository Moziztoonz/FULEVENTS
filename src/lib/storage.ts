import { randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

export const MAX_FLYER_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, { ext: string; mime: string }> = {
  jpeg: { ext: "jpg", mime: "image/jpeg" },
  png: { ext: "png", mime: "image/png" },
  webp: { ext: "webp", mime: "image/webp" },
};

export const uploadRoot = path.resolve(process.cwd(), env.uploadDir);

function detectType(bytes: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/**
 * Validates an uploaded flyer by its actual bytes (not the browser-supplied
 * MIME type or file name) and writes it to persistent storage.
 * Returns the stored file name.
 */
export async function saveFlyer(file: File): Promise<string> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new Error("Please choose a flyer image.");
  }
  if (file.size > MAX_FLYER_BYTES) {
    throw new Error("That flyer is larger than 5MB. Please upload a smaller image.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectType(buffer);
  if (!kind) {
    throw new Error("Flyers must be a JPG, PNG or WEBP image.");
  }
  const name = `${randomUUID()}.${TYPES[kind].ext}`;
  const dir = path.join(uploadRoot, "events");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return name;
}

/** Saves bytes written by the seed script (already validated upstream). */
export async function saveFlyerBuffer(buffer: Buffer, ext: string): Promise<string> {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const name = `${randomUUID()}.${safeExt}`;
  const dir = path.join(uploadRoot, "events");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return name;
}

export async function deleteFlyer(name: string | null | undefined): Promise<void> {
  if (!name) return;
  const safe = path.basename(name);
  await fs.rm(path.join(uploadRoot, "events", safe), { force: true });
}

export function contentTypeFor(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}
