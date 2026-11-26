/**
 * POST /admin/upload — image upload for the admin (service photos).
 * Body: multipart form with `file`. Returns { url } (e.g. /uploads/services/3f…a1.jpg) or { error }.
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { MAX_UPLOAD_BYTES, UPLOAD_ROOT, sniffImage } from "@/lib/uploads";

const json = (body: object, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  // Same checks as requirePermission("catalog.manage"), but answering with JSON instead of a redirect.
  const session = await readSession();
  if (!session) return json({ error: "Please log in again." }, 401);
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true, isActive: true } });
  if (!user?.isActive) return json({ error: "Please log in again." }, 401);
  if (!can(user.role, "catalog.manage")) return json({ error: "You don't have permission to upload photos." }, 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Upload failed — please try again." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return json({ error: "Choose an image file." }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: "That image is over 8 MB. Please use a smaller one." }, 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return json({ error: "Only JPG, PNG, WebP, AVIF or GIF images can be uploaded." }, 415);

  const dir = path.join(UPLOAD_ROOT, "services");
  const name = `${randomUUID()}.${kind.ext}`; // random name: no clashes, nothing from the user's file name
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return json({ url: `/uploads/services/${name}` });
}
