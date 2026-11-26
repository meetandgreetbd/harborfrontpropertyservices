/**
 * Uploaded images (service photos). The database stores the link (ServiceImage.url = "/uploads/services/<file>");
 * the file itself is on disk in UPLOAD_ROOT/<folder>/, outside /public, served by app/uploads/[...path]/route.ts
 * (files added to /public after the build aren't reliably served by Next.js).
 *
 * Default folder: <project>/uploads. On cPanel, set UPLOAD_DIR in .env to a folder OUTSIDE the app folder
 * (e.g. /home/<cpanel-user>/harborfront-uploads) so re-deploying the app can never delete photos.
 * Needs a persistent disk (cPanel / VPS). On serverless hosting (Vercel), swap this for S3 / R2.
 */
import path from "node:path";

export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Allowed image types, detected from the file's first bytes (never trust the browser's type or the file name). */
export function sniffImage(buf: Uint8Array): { ext: string; type: string } | null {
  const b = (i: number) => buf[i];
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return { ext: "png", type: "image/png" };
  if (b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38) return { ext: "gif", type: "image/gif" };
  const ascii = (from: number, to: number) => String.fromCharCode(...buf.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  if (ascii(4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(8, 12))) return { ext: "avif", type: "image/avif" };
  return null;
}

export const contentTypeFor = (file: string) =>
  ({ jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", avif: "image/avif" })[path.extname(file).slice(1).toLowerCase()] ?? null;

/** Resolve a public URL path segment list to a file inside UPLOAD_ROOT, or null if it tries to escape. */
export function resolveUpload(segments: string[]) {
  const file = path.resolve(UPLOAD_ROOT, ...segments);
  return file.startsWith(UPLOAD_ROOT + path.sep) ? file : null;
}
