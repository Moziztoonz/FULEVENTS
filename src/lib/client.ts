"use client";

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T & { error?: string; fields?: Record<string, string> };
}

export async function sendJson<T = Record<string, unknown>>(
  url: string,
  method: "POST" | "PATCH" | "DELETE" | "PUT",
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiResult<T>["data"];
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "You appear to be offline. Check your connection and try again." } as ApiResult<T>["data"],
    };
  }
}

export async function sendForm<T = Record<string, unknown>>(
  url: string,
  formData: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, { method, body: formData });
    const data = (await response.json().catch(() => ({}))) as ApiResult<T>["data"];
    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Upload failed. Check your connection and try again." } as ApiResult<T>["data"],
    };
  }
}

/**
 * Shrinks a large flyer in the browser before upload: longest edge 1600px,
 * WEBP when supported. Falls back to the original file on any failure so the
 * server still validates it.
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 350 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const type = canvas.toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg");
    return new File([blob], name, { type });
  } catch {
    return file;
  }
}
