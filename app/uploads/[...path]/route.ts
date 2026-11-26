/**
 * GET /uploads/… — serves images uploaded in the admin (see lib/uploads.ts).
 * Files have random, never-reused names, so they can be cached forever.
 */
import { readFile } from "node:fs/promises";
import { contentTypeFor, resolveUpload } from "@/lib/uploads";

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path } = await ctx.params;
  const file = resolveUpload(path);
  const type = file && contentTypeFor(file);
  if (!file || !type) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
