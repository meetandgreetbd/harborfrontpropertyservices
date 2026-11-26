"use client";

import { useActionState, useState, startTransition } from "react";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { saveSiteInfo, saveTracking } from "@/app/admin/settings-actions";
import type { FormState } from "@/lib/validations/catalog";
import type { DayHours, SocialKey } from "@/lib/data/settings";
import { Card, ErrorText, Field, TextArea, Toggle, inputCls } from "./form";

const WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

/** Submit without React resetting the form (keeps what was typed if validation fails). */
function useSettingsAction(fn: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState<FormState, FormData>(fn, { status: "idle" });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  return { state, pending, onSubmit, err: (k: string) => state.fieldErrors?.[k] };
}

function SaveRow({ state, pending, label }: { state: FormState; pending: boolean; label: string }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-6 py-3 backdrop-blur md:-mx-10 md:px-10">
      <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-5 py-2.5 font-medium text-canvas hover:bg-night-600 disabled:opacity-60">
        <Save size={16} /> {pending ? "Saving…" : label}
      </button>
      {state.status === "saved" && (
        <span role="status" className="inline-flex items-center gap-1.5 text-[0.88rem] text-emerald-700">
          <CheckCircle2 size={16} /> {state.message}
        </span>
      )}
      {state.status === "error" && (
        <span role="alert" className="inline-flex items-center gap-1.5 text-[0.88rem] text-red-700">
          <AlertCircle size={16} /> {state.message}
        </span>
      )}
    </div>
  );
}

export type SiteInfoValues = {
  phone: string;
  email: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  lat: string;
  lng: string;
  hours: DayHours[];
  notifyEmails: string;
  notifyNewRequests: boolean;
  notifyNewBookings: boolean;
  customerConfirmations: boolean;
  social: Record<SocialKey, string>;
};

export function SiteInfoForm({
  values,
  networks,
  smtpReady,
}: {
  values: SiteInfoValues;
  networks: { key: SocialKey; label: string; placeholder: string }[];
  smtpReady: boolean;
}) {
  const { state, pending, onSubmit, err } = useSettingsAction(saveSiteInfo);
  const [hours, setHours] = useState(values.hours);
  const setDay = (day: number, patch: Partial<DayHours>) => setHours((hs) => hs.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card title="Contact details" description="Shown in the header, contact page, call buttons and Google's business listing data (schema).">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business phone" name="phone" type="tel" defaultValue={values.phone} error={err("phone")} placeholder="(555) 123-4567" />
          <Field label="Public email" name="email" type="email" defaultValue={values.email} error={err("email")} placeholder="office@yourdomain.com" />
        </div>
      </Card>

      <Card title="Business address" description="Use a real commercial address and spell it exactly as on your Google Business Profile.">
        <Field label="Street" name="street" defaultValue={values.street} error={err("street")} placeholder="123 Main St, Suite 100" />
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="City" name="city" defaultValue={values.city} error={err("city")} className="sm:col-span-2" />
          <Field label="State" name="region" defaultValue={values.region} error={err("region")} placeholder="TX" maxLength={60} />
          <Field label="ZIP" name="postalCode" defaultValue={values.postalCode} error={err("postalCode")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Country" name="country" defaultValue={values.country} error={err("country")} maxLength={2} hint="2 letters" />
          <Field label="Latitude" name="lat" inputMode="decimal" defaultValue={values.lat} error={err("lat")} hint="optional" placeholder="32.7767" />
          <Field label="Longitude" name="lng" inputMode="decimal" defaultValue={values.lng} error={err("lng")} hint="optional" placeholder="-96.7970" />
        </div>
      </Card>

      <Card title="Office hours" description="Shown on the contact page and sent to Google. Online booking days are set per service.">
        <ul className="divide-y divide-line border-y border-line">
          {MON_FIRST.map((day) => {
            const h = hours.find((x) => x.day === day)!;
            return (
              <li key={day} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5">
                <label className="flex w-40 cursor-pointer items-center gap-2.5 text-[0.92rem] font-medium text-ink">
                  <input type="checkbox" name={`open-${day}`} checked={h.open} onChange={(e) => setDay(day, { open: e.target.checked })} className="h-4 w-4 accent-[#2563eb]" />
                  {WEEK[day]}
                </label>
                {h.open ? (
                  <span className="flex items-center gap-2 text-[0.9rem] text-muted">
                    <input type="time" name={`opens-${day}`} value={h.opens} onChange={(e) => setDay(day, { opens: e.target.value })} aria-label={`${WEEK[day]} opens`} className={inputCls(!!err(`hours-${day}`), "w-32")} />
                    to
                    <input type="time" name={`closes-${day}`} value={h.closes} onChange={(e) => setDay(day, { closes: e.target.value })} aria-label={`${WEEK[day]} closes`} className={inputCls(!!err(`hours-${day}`), "w-32")} />
                  </span>
                ) : (
                  <span className="text-[0.88rem] text-muted">Closed</span>
                )}
                <ErrorText>{err(`hours-${day}`)}</ErrorText>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card
        title="Email notifications"
        description="Who gets an email when a customer sends a quote request, work order or booking."
        aside={
          <span className={clsx("rounded-full border px-2.5 py-0.5 text-[0.75rem]", smtpReady ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900")}>
            {smtpReady ? "SMTP connected" : "SMTP not set — emails are only logged"}
          </span>
        }
      >
        <TextArea
          label="Send notifications to"
          name="notifyEmails"
          rows={2}
          defaultValue={values.notifyEmails}
          error={err("notifyEmails")}
          placeholder="office@yourdomain.com, owner@gmail.com"
          hint="Separate several emails with commas. Empty = public email."
        />
        <div className="space-y-4 border-t border-line pt-4">
          <Toggle name="notifyNewRequests" label="New quote requests & work orders" description="Email the team when a website form is sent." defaultChecked={values.notifyNewRequests} />
          <Toggle name="notifyNewBookings" label="New online bookings" description="Email the team when someone books online." defaultChecked={values.notifyNewBookings} />
          <Toggle name="customerConfirmations" label="Confirmation email to the customer" description="Send the customer a 'we got your request / booking' email." defaultChecked={values.customerConfirmations} />
        </div>
      </Card>

      <Card title="Social media" description="Links appear in the footer and are sent to Google as your official profiles. Leave empty to hide.">
        <div className="grid gap-4 sm:grid-cols-2">
          {networks.map((n) => (
            <Field key={n.key} label={n.label} name={n.key} type="url" defaultValue={values.social[n.key]} error={err(n.key)} placeholder={n.placeholder} />
          ))}
        </div>
      </Card>

      <SaveRow state={state} pending={pending} label="Save site info" />
    </form>
  );
}

export type TrackingValues = {
  googleTagIds: string;
  gtmId: string;
  metaPixelId: string;
  clarityId: string;
  googleVerification: string;
  bingVerification: string;
};

export function TrackingForm({ values }: { values: TrackingValues }) {
  const { state, pending, onSubmit, err } = useSettingsAction(saveTracking);
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card title="Google Analytics & Google Ads" description="Paste the ID only — we add the Google tag (gtag.js) to every public page for you.">
        <Field
          label="Google tag ID(s)"
          name="googleTagIds"
          defaultValue={values.googleTagIds}
          error={err("googleTagIds")}
          placeholder="G-XXXXXXXXXX, AW-XXXXXXXXX"
          hint="GA4 → Admin → Data streams → Measurement ID"
        />
        <Field
          label="Google Tag Manager container"
          name="gtmId"
          defaultValue={values.gtmId}
          error={err("gtmId")}
          placeholder="GTM-XXXXXXX"
          hint="Optional — use either GTM or the tag above for GA4, not both"
        />
      </Card>

      <Card title="Other tracking" description="Optional. Leave empty to turn off.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta (Facebook) Pixel ID" name="metaPixelId" defaultValue={values.metaPixelId} error={err("metaPixelId")} placeholder="123456789012345" />
          <Field label="Microsoft Clarity project ID" name="clarityId" defaultValue={values.clarityId} error={err("clarityId")} placeholder="abcd1234ef" />
        </div>
      </Card>

      <Card title="Search engine verification" description="Proves you own the site in Google Search Console and Bing Webmaster Tools. Paste the code or the whole meta tag.">
        <Field
          label="Google Search Console"
          name="googleVerification"
          defaultValue={values.googleVerification}
          error={err("googleVerification")}
          placeholder={'<meta name="google-site-verification" content="…">'}
          hint="HTML tag method"
        />
        <Field
          label="Bing Webmaster Tools"
          name="bingVerification"
          defaultValue={values.bingVerification}
          error={err("bingVerification")}
          placeholder={'<meta name="msvalidate.01" content="…">'}
          hint="HTML meta tag method"
        />
      </Card>

      <p className="text-[0.82rem] text-muted">
        Codes load on the public website only (never in the admin). If you add Meta Pixel or Clarity, mention them in your privacy policy.
      </p>

      <SaveRow state={state} pending={pending} label="Save tracking" />
    </form>
  );
}
