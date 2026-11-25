"use server";

import { z } from "zod";
import { leadSchema, type Lead, type LeadFormState } from "@/lib/validations/lead";
import { site } from "@/lib/site";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";

/**
 * Handles quote requests and work orders.
 * validate → save to MySQL (shows in /admin/leads) → email the office over SMTP → confirm to the customer.
 * SMTP settings live in .env (see lib/email.ts). Without SMTP_HOST, emails are logged to the console.
 */
export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );

  // Honeypot: real people never fill this hidden field.
  if (raw.website) {
    return { status: "success", message: "Thanks — we've got your request." };
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as LeadFormState["fieldErrors"],
      values: raw,
    };
  }

  // 1) Save first, so a lead is never lost even if email fails.
  try {
    await saveLead(parsed.data);
  } catch (err) {
    console.error("[lead] database save failed", err);
    return {
      status: "error",
      message: `Something went wrong sending your request. Please call us on ${site.phone}.`,
      values: raw,
    };
  }

  // 2) Notify by email. Failure is logged; the lead is already in the admin dashboard.
  try {
    await deliver(parsed.data);
  } catch (err) {
    console.error("[lead] email delivery failed (lead saved)", err);
  }

  return {
    status: "success",
    message:
      parsed.data.kind === "work-order"
        ? "Work order received. We'll confirm the schedule by email, usually the same business day."
        : "Thanks — we've got your request. We'll get back to you with a price or a time to come look, usually the same business day.",
  };
}

async function saveLead(lead: Lead) {
  await db.lead.create({
    data: {
      kind: lead.kind,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      service: lead.service,
      message: lead.message,
      ...(lead.kind === "work-order"
        ? { company: lead.company, reference: lead.reference, dueDate: lead.dueDate, access: lead.access }
        : { propertyType: lead.propertyType }),
      source: "website",
      activities: {
        create: {
          type: "created",
          byName: "Website",
          message: lead.kind === "work-order" ? "Work order submitted on the website" : "Quote request submitted on the website",
        },
      },
    },
  });
}

function formatLead(lead: Lead) {
  const rows: [string, string][] = [
    ["Type", lead.kind === "work-order" ? "Work order" : "Quote request"],
    ...(lead.kind === "work-order"
      ? ([
          ["Company", lead.company],
          ["Reference", lead.reference],
          ["Due date", lead.dueDate],
          ["Access", lead.access],
        ] as [string, string][])
      : ([["Property type", lead.propertyType]] as [string, string][])),
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Property address", lead.address],
    ["Service", lead.service],
    ["Details", lead.message],
  ];
  return rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

async function deliver(lead: Lead) {
  const to = process.env.LEAD_TO_EMAIL || site.email;
  const subjectPrefix = lead.kind === "work-order" ? "Work order" : "Quote request";

  await sendMail({
    to,
    replyTo: lead.email,
    subject: `${subjectPrefix}: ${lead.service || "General"} — ${lead.address}`,
    text: `${formatLead(lead)}\n\nOpen in admin: ${site.url}/admin/leads`,
  });

  // Confirmation to the customer (plain text keeps it personal and avoids spam filters).
  await sendMail({
    to: lead.email,
    replyTo: to,
    subject: `We received your request — ${site.name}`,
    text: `Hi ${lead.name.split(" ")[0]},\n\nThanks for getting in touch. We've received your ${
      lead.kind === "work-order" ? "work order" : "request"
    } for ${lead.address} and will get back to you shortly, usually the same business day.\n\nIf it's urgent, call us on ${site.phone}.\n\n— ${site.owner.name}\n${site.name}`,
  });
}
