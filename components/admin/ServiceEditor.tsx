"use client";

import { useActionState, useState, startTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowUp, ArrowDown, Globe, FileText } from "lucide-react";
import clsx from "clsx";
import { saveService } from "@/app/admin/catalog-actions";
import type { FormState } from "@/lib/validations/catalog";
import { bookingModes, priceTypes, slugify } from "@/lib/catalog";
import { ServiceIcon, serviceIconKeys, serviceIcons } from "@/lib/service-icons";
import { Card, Field, Select, TextArea, Toggle, SeoPanel, SaveBar, inputCls, ErrorText } from "./form";
import { PhotoManager } from "./PhotoManager";

export type ServiceEditorData = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  icon: string;
  intro: string;
  included: string[];
  goodFor: string[];
  bookingMode: string;
  priceType: string;
  basePrice: string;
  priceNote: string;
  durationMin: number;
  bufferMin: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  slotIntervalMin: number;
  requiresStaff: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
  options: { name: string; description: string; price: string; durationMin: string; isActive: boolean }[];
  faqs: { question: string; answer: string }[];
  images: { url: string; alt: string; caption: string; isCover: boolean }[];
  relatedIds: string[];
};

const initial: FormState = { status: "idle" };

function move<T>(list: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function ServiceEditor({
  service,
  categories,
  allServices,
  footer,
}: {
  service: ServiceEditorData;
  categories: { id: string; name: string }[];
  allServices: { id: string; name: string }[];
  footer?: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(saveService, initial);
  const [name, setName] = useState(service.name);
  const [slug, setSlug] = useState(service.slug);
  const [priceType, setPriceType] = useState(service.priceType);
  const [options, setOptions] = useState(service.options);
  const [faqs, setFaqs] = useState(service.faqs);
  const [images, setImages] = useState(service.images);
  const err = (k: string) => state.fieldErrors?.[k];

  // Submit without React's automatic form reset, so fields keep what was just saved.
  // Draft / Published as confirmed by the last successful save (server is the source of truth).
  const published = state.published ?? service.isPublished;
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Which save button was used: "draft" or "publish" (sent to the server as "intent").
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget);
    fd.set("intent", submitter?.value === "draft" ? "draft" : "publish");
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="hidden" name="id" value={service.id} />
      <input type="hidden" name="options" value={JSON.stringify(options.map((o) => ({ ...o, price: o.price, durationMin: o.durationMin })))} />
      <input type="hidden" name="faqs" value={JSON.stringify(faqs)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="grid gap-6 xl:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-6 xl:col-span-2">
          <Card title="Basics">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Service name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={err("name")}
                placeholder="e.g. Gutter Cleaning"
              />
              <Field
                label="URL slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder={slugify(name) || "gutter-cleaning"}
                error={err("slug")}
                hint={`/services/${slug || slugify(name) || "…"}`}
              />
            </div>
            <TextArea
              label="Short description"
              name="shortDescription"
              defaultValue={service.shortDescription}
              rows={2}
              error={err("shortDescription")}
              hint="One line — shown in service lists"
            />
            <fieldset>
              <legend className="text-[0.85rem] font-medium">Card icon</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {serviceIconKeys.map((key) => (
                  <label key={key} title={serviceIcons[key].label} className="cursor-pointer">
                    <input type="radio" name="icon" value={key} defaultChecked={service.icon === key} className="peer sr-only" />
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-muted transition-colors peer-checked:border-brand peer-checked:bg-brand-50 peer-checked:text-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand hover:text-night">
                      <ServiceIcon name={key} size={20} />
                    </span>
                    <span className="sr-only">{serviceIcons[key].label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card title="Page content">
            <TextArea
              label="Introduction"
              name="intro"
              defaultValue={service.intro}
              rows={7}
              hint="Separate paragraphs with a blank line"
              error={err("intro")}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextArea
                label="What's included"
                name="included"
                defaultValue={service.included.join("\n")}
                rows={7}
                hint="One item per line"
              />
              <TextArea label="Good fit for" name="goodFor" defaultValue={service.goodFor.join("\n")} rows={7} hint="One per line" />
            </div>
          </Card>

          <Card
            title="Options & packages"
            description="Variants customers can choose, e.g. “1 hour”, “Half day”, “2 doors”. A package price is the total for that option; leave it empty to show the service's normal price."
            aside={
              <AddButton onClick={() => setOptions([...options, { name: "", description: "", price: "", durationMin: "", isActive: true }])}>
                Add option
              </AddButton>
            }
          >
            {options.length === 0 && <Empty>No options. Customers book the service as one item.</Empty>}
            {options.map((o, i) => (
              <Row
                key={i}
                index={i}
                count={options.length}
                onMove={(d) => setOptions(move(options, i, d))}
                onRemove={() => setOptions(options.filter((_, j) => j !== i))}
              >
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <MiniInput
                    label="Option name"
                    value={o.name}
                    error={err(`options.${i}.name`)}
                    onChange={(v) => setOptions(options.map((x, j) => (j === i ? { ...x, name: v } : x)))}
                  />
                  <MiniInput
                    label="Package price ($)"
                    value={o.price}
                    inputMode="decimal"
                    error={err(`options.${i}.price`)}
                    onChange={(v) => setOptions(options.map((x, j) => (j === i ? { ...x, price: v } : x)))}
                  />
                  <MiniInput
                    label="Duration (min)"
                    value={o.durationMin}
                    inputMode="numeric"
                    error={err(`options.${i}.durationMin`)}
                    onChange={(v) => setOptions(options.map((x, j) => (j === i ? { ...x, durationMin: v } : x)))}
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <MiniInput
                    label="Description (optional)"
                    value={o.description}
                    onChange={(v) => setOptions(options.map((x, j) => (j === i ? { ...x, description: v } : x)))}
                  />
                  <label className="inline-flex items-center gap-2 pb-2 text-[0.85rem]">
                    <input
                      type="checkbox"
                      checked={o.isActive}
                      onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, isActive: e.target.checked } : x)))}
                    />
                    Active
                  </label>
                </div>
              </Row>
            ))}
          </Card>

          <Card
            title="FAQs"
            description="Shown on the service page and the FAQ page, with FAQ schema for Google."
            aside={<AddButton onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>Add FAQ</AddButton>}
          >
            {faqs.length === 0 && <Empty>No FAQs yet.</Empty>}
            {faqs.map((f, i) => (
              <Row
                key={i}
                index={i}
                count={faqs.length}
                onMove={(d) => setFaqs(move(faqs, i, d))}
                onRemove={() => setFaqs(faqs.filter((_, j) => j !== i))}
              >
                <MiniInput
                  label="Question"
                  value={f.question}
                  error={err(`faqs.${i}.question`)}
                  onChange={(v) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, question: v } : x)))}
                />
                <div className="mt-3">
                  <label className="text-[0.78rem] font-medium text-muted">Answer</label>
                  <textarea
                    value={f.answer}
                    rows={3}
                    onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
                    className={inputCls(!!err(`faqs.${i}.answer`))}
                  />
                  <ErrorText>{err(`faqs.${i}.answer`)}</ErrorText>
                </div>
              </Row>
            ))}
          </Card>

          <Card title="Photos" description="Upload job photos (or add by link). Alt text is required. The cover photo is shown at the top of the page.">
            <PhotoManager photos={images} onChange={setImages} errorFor={err} />
          </Card>

          <Card title="SEO" description="How this page appears in Google.">
            <SeoPanel
              path={`/services/${slug || slugify(name) || "…"}`}
              defaultTitle={`${name || "Service name"} in Your City`}
              defaultDescription="Uses the short description when empty."
              title={service.metaTitle}
              description={service.metaDescription}
              noIndex={service.noIndex}
              errors={state.fieldErrors}
            />
          </Card>
        </div>

        {/* ── Side column ── */}
        <div className="space-y-6">
          <Card title="Visibility">
            <div
              className={clsx(
                "flex items-start gap-3 rounded-[3px] border px-3 py-2.5",
                published ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-neutral-50",
              )}
            >
              {published ? <Globe size={18} className="mt-0.5 text-emerald-700" /> : <FileText size={18} className="mt-0.5 text-neutral-500" />}
              <div>
                <p className={clsx("text-[0.9rem] font-medium", published ? "text-emerald-900" : "text-neutral-700")}>{published ? "Published" : "Draft"}</p>
                <p className="text-[0.78rem] text-muted">
                  {published ? "Live on the website and in the sitemap." : "Only visible here. Use “Publish” when it's ready."}
                </p>
              </div>
            </div>
            <Toggle name="isFeatured" label="Featured on homepage" defaultChecked={service.isFeatured} />
            <Field label="Sort order" name="sortOrder" type="number" min={0} defaultValue={service.sortOrder} hint="Lower shows first" />
          </Card>

          <Card title="Category">
            <Select label="Category" name="categoryId" defaultValue={service.categoryId} error={err("categoryId")}>
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Link href="/admin/categories" className="text-[0.82rem] text-night underline">
              Manage categories
            </Link>
          </Card>

          <Card title="Pricing">
            <Select label="Price type" name="priceType" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
              {priceTypes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
            {priceType !== "QUOTE" && (
              <Field
                label={priceType === "HOURLY" ? "Hourly rate ($)" : priceType === "STARTING_AT" ? "Starting price ($)" : "Price ($)"}
                name="basePrice"
                inputMode="decimal"
                defaultValue={service.basePrice}
                error={err("basePrice")}
                placeholder="95"
              />
            )}
            <TextArea label="Price note" name="priceNote" defaultValue={service.priceNote} rows={2} placeholder="e.g. plus materials at cost" />
          </Card>

          <Card title="Booking rules" description="Used by online booking.">
            <Select label="How customers book" name="bookingMode" defaultValue={service.bookingMode}>
              {bookingModes.map((b) => (
                <option key={b.value} value={b.value} title={b.help}>
                  {b.label}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Visit length" name="durationMin" type="number" min={15} step={15} defaultValue={service.durationMin} hint="min" error={err("durationMin")} />
              <Field label="Buffer after" name="bufferMin" type="number" min={0} step={5} defaultValue={service.bufferMin} hint="min" />
              <Field label="Min. notice" name="minNoticeHours" type="number" min={0} defaultValue={service.minNoticeHours} hint="hours" />
              <Field label="Book ahead" name="maxAdvanceDays" type="number" min={1} defaultValue={service.maxAdvanceDays} hint="days" />
              <Field label="Start times every" name="slotIntervalMin" type="number" min={15} step={15} defaultValue={service.slotIntervalMin} hint="min" />
            </div>
            <Toggle name="requiresStaff" label="Needs a crew member free" defaultChecked={service.requiresStaff} />
          </Card>

          <Card title="Often booked together">
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {allServices
                .filter((s) => s.id !== service.id)
                .map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-[0.88rem]">
                    <input type="checkbox" name="relatedIds" value={s.id} defaultChecked={service.relatedIds.includes(s.id)} />
                    {s.name}
                  </label>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <SaveBar
          state={state}
          pending={pending}
          label={published && service.id ? "Update" : "Publish"}
          icon={<Globe size={16} />}
          secondary={
            <button
              type="submit"
              value="draft"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-night px-4 py-2.5 font-medium text-night hover:bg-canvas disabled:opacity-60"
            >
              <FileText size={16} /> {published && service.id ? "Unpublish & save as draft" : "Save as draft"}
            </button>
          }
          extra={footer}
        />
      </div>
    </form>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border border-night px-3 py-1.5 text-[0.82rem] text-night hover:bg-night hover:text-canvas"
    >
      <Plus size={14} /> {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.88rem] text-muted">{children}</p>;
}

function Row({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  count: number;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-[3px] border border-line bg-canvas/30 p-3">
      <div className="flex flex-col items-center gap-1 pt-5 text-muted">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up" className="disabled:opacity-30">
          <ArrowUp size={15} />
        </button>
        <span className="tabular text-[0.72rem]">{index + 1}</span>
        <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down" className="disabled:opacity-30">
          <ArrowDown size={15} />
        </button>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      <button type="button" onClick={onRemove} aria-label="Remove" className="self-start pt-5 text-muted hover:text-red-700">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function MiniInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <label className="block">
      <span className="text-[0.78rem] font-medium text-muted">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls(!!error)}
      />
      <ErrorText>{error}</ErrorText>
    </label>
  );
}
