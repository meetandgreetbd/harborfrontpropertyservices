"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Star, Trash2, AlertCircle } from "lucide-react";

export type Photo = { url: string; alt: string; caption: string; isCover: boolean };

const MAX_MB = 8;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const miniInput =
  "mt-1 block w-full rounded-[3px] border bg-white px-2.5 py-1.5 text-[0.88rem] focus:border-night focus:outline-none focus:ring-1 focus:ring-night";

/**
 * Service photos: upload from the computer (several at once, or drag & drop), or add by link.
 * Each photo shows a preview with alt text, caption, cover, reorder and Remove.
 */
export function PhotoManager({
  photos,
  onChange,
  errorFor,
}: {
  photos: Photo[];
  onChange: (next: Photo[]) => void;
  errorFor: (key: string) => string | undefined;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [link, setLink] = useState("");

  // Latest list for async uploads finishing one by one.
  const latest = useRef(photos);
  latest.current = photos;
  const add = (p: Omit<Photo, "isCover">) => {
    const list = latest.current;
    const next = [...list, { ...p, isCover: list.length === 0 }];
    latest.current = next;
    onChange(next);
  };
  const update = (i: number, patch: Partial<Photo>) => onChange(photos.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => {
    const next = photos.filter((_, j) => j !== i);
    if (photos[i].isCover && next.length) next[0] = { ...next[0], isCover: true }; // keep a cover
    onChange(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    setErrors([]);
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        setErrors((e) => [...e, `${file.name}: not an image.`]);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setErrors((e) => [...e, `${file.name}: over ${MAX_MB} MB.`]);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/admin/upload", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error || "Upload failed.");
        // Suggest alt text from the file name; the admin should improve it.
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        add({ url: data.url, alt: alt.length >= 3 ? alt : "", caption: "" });
      } catch (err) {
        setErrors((e) => [...e, `${file.name}: ${err instanceof Error ? err.message : "upload failed."}`]);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const addLink = () => {
    const url = link.trim();
    if (!url) return;
    add({ url, alt: "", caption: "" });
    setLink("");
    setLinkMode(false);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone + buttons */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={clsx(
          "flex flex-col items-center justify-center gap-3 rounded-[4px] border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragOver ? "border-night bg-canvas" : "border-line",
        )}
      >
        <ImagePlus size={26} className="text-muted" />
        <p className="text-[0.88rem] text-muted">Drag photos here, or</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading > 0}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-4 py-2 text-[0.86rem] text-canvas hover:bg-night-600 disabled:opacity-60"
          >
            {uploading > 0 ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            {uploading > 0 ? `Uploading ${uploading}…` : "Upload photos"}
          </button>
          <button
            type="button"
            onClick={() => setLinkMode((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-line px-3 py-2 text-[0.84rem] text-night hover:border-night"
          >
            <Link2 size={15} /> Add by link
          </button>
        </div>
        <p className="text-[0.76rem] text-muted">JPG, PNG, WebP, AVIF or GIF · up to {MAX_MB} MB each · you can pick several</p>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = ""; // allow picking the same file again
          }}
        />
        {linkMode && (
          <div className="flex w-full max-w-lg gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
              placeholder="https://… or /photos/name.jpg"
              aria-label="Image link"
              className={clsx(miniInput, "mt-0 border-line")}
            />
            <button type="button" onClick={addLink} className="shrink-0 rounded-[3px] border border-night px-3 text-[0.84rem] text-night hover:bg-night hover:text-canvas">
              Add
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-800">
          {errors.map((e) => (
            <li key={e} className="flex items-start gap-1.5">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {e}
            </li>
          ))}
        </ul>
      )}

      {photos.length === 0 && uploading === 0 && <p className="text-[0.86rem] text-muted">No photos yet — a labelled placeholder is shown on the page.</p>}

      {/* Photo list */}
      <ul className="space-y-3">
        {photos.map((img, i) => (
          <li key={img.url + i} className={clsx("flex gap-4 rounded-[4px] border p-3", img.isCover ? "border-night" : "border-line")}>
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[3px] bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary URL */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {img.isCover && <span className="absolute left-1 top-1 rounded bg-night px-1.5 py-0.5 text-[0.66rem] font-medium text-canvas">Cover</span>}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <label className="block text-[0.78rem] font-medium">
                Alt text (describe the photo) <span className="text-red-700">*</span>
                <input
                  value={img.alt}
                  onChange={(e) => update(i, { alt: e.target.value })}
                  placeholder="e.g. Repainted kitchen in a rental unit"
                  className={clsx(miniInput, errorFor(`images.${i}.alt`) ? "border-red-700" : "border-line")}
                />
              </label>
              {errorFor(`images.${i}.alt`) && <p className="text-[0.76rem] text-red-700">{errorFor(`images.${i}.alt`)}</p>}
              {errorFor(`images.${i}.url`) && <p className="text-[0.76rem] text-red-700">{errorFor(`images.${i}.url`)}</p>}
              <label className="block text-[0.78rem] font-medium">
                Caption <span className="font-normal text-muted">(optional)</span>
                <input value={img.caption} onChange={(e) => update(i, { caption: e.target.value })} className={clsx(miniInput, "border-line")} />
              </label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onChange(photos.map((x, j) => ({ ...x, isCover: j === i })))}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-[3px] border px-2.5 py-1 text-[0.78rem]",
                    img.isCover ? "border-night bg-night text-canvas" : "border-line text-night hover:border-night",
                  )}
                >
                  <Star size={13} /> {img.isCover ? "Cover photo" : "Make cover"}
                </button>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded-[3px] border border-line p-1 text-muted hover:text-night disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  aria-label="Move down"
                  className="rounded-[3px] border border-line p-1 text-muted hover:text-night disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-auto inline-flex items-center gap-1 rounded-[3px] border border-red-200 px-2.5 py-1 text-[0.78rem] text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {photos.length > 0 && <p className="text-[0.76rem] text-muted">Changes to photos are saved when you click Save at the bottom of the page.</p>}
    </div>
  );
}
