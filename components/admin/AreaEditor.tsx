"use client";

import { useActionState, useState, startTransition } from "react";
import { saveArea } from "@/app/admin/catalog-actions";
import type { FormState } from "@/lib/validations/catalog";
import { slugify } from "@/lib/catalog";
import { Card, Field, TextArea, Toggle, SeoPanel, SaveBar } from "./form";

export type AreaEditorData = {
  id: string;
  city: string;
  region: string;
  slug: string;
  intro: string;
  neighborhoods: string[];
  zipCodes: string[];
  localNotes: string[];
  serviceIds: string[];
  isPublished: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
};

export function AreaEditor({ area, allServices }: { area: AreaEditorData; allServices: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveArea, { status: "idle" });
  const [city, setCity] = useState(area.city);
  const [region, setRegion] = useState(area.region);
  const [slug, setSlug] = useState(area.slug);
  const err = (k: string) => state.fieldErrors?.[k];
  const autoSlug = slugify(`${city} ${region}`);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="hidden" name="id" value={area.id} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Location">
            <div className="grid gap-5 sm:grid-cols-[2fr_1fr_2fr]">
              <Field label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} error={err("city")} />
              <Field label="State" name="region" value={region} onChange={(e) => setRegion(e.target.value.toUpperCase())} maxLength={10} error={err("region")} placeholder="TX" />
              <Field
                label="URL slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder={autoSlug}
                error={err("slug")}
                hint={`/service-areas/${slug || autoSlug || "…"}`}
              />
            </div>
          </Card>

          <Card title="Local content" description="Write unique copy for every city — copied pages with only the name swapped can hurt rankings.">
            <TextArea
              label="Introduction"
              name="intro"
              defaultValue={area.intro}
              rows={5}
              error={err("intro")}
              placeholder="What kind of properties you look after here and how quickly you can get there."
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <TextArea label="Neighborhoods" name="neighborhoods" defaultValue={area.neighborhoods.join("\n")} rows={6} hint="One per line" />
              <TextArea label="ZIP codes" name="zipCodes" defaultValue={area.zipCodes.join("\n")} rows={6} hint="One per line" />
              <TextArea
                label="Local notes"
                name="localNotes"
                defaultValue={area.localNotes.join("\n")}
                rows={6}
                hint="One per line"
                placeholder={"Freeze/thaw winters\nLots of 1950s duplexes\nRental registration required"}
              />
            </div>
          </Card>

          <Card title="SEO">
            <SeoPanel
              path={`/service-areas/${slug || autoSlug || "…"}`}
              defaultTitle={`Property Maintenance in ${city || "City"}, ${region || "ST"}`}
              defaultDescription={`Property maintenance, repairs, turnovers and inspections in ${city || "City"}, ${region || "ST"}. Local crew, free quotes and photo reports on every job.`}
              title={area.metaTitle}
              description={area.metaDescription}
              noIndex={area.noIndex}
              errors={state.fieldErrors}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <Toggle
              name="isPublished"
              label="Published"
              description="Drafts can be previewed but are hidden from Google and the sitemap."
              defaultChecked={area.isPublished}
            />
            <Field label="Sort order" name="sortOrder" type="number" min={0} defaultValue={area.sortOrder} hint="Lower shows first" />
          </Card>
          <Card title="Services offered here" description="Listed on the city page.">
            <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
              {allServices.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-[0.88rem]">
                  <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={area.serviceIds.includes(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <SaveBar state={state} pending={pending} label={area.id ? "Save changes" : "Create service area"} />
      </div>
    </form>
  );
}
