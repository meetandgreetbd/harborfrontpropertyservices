import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a phone number we can reach you on")
  .max(30)
  .regex(/^[0-9+().\-\s]+$/, "Use digits only");

const base = {
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.email("Enter a valid email address").max(200),
  phone,
  address: z.string().trim().min(5, "Enter the property address").max(300),
  service: z.string().trim().max(100).optional().default(""),
  message: z.string().trim().min(10, "Tell us a little about the job").max(4000),
};

export const estimateSchema = z.object({
  kind: z.literal("estimate"),
  ...base,
  propertyType: z.string().trim().max(60).optional().default(""),
});

export const workOrderSchema = z.object({
  kind: z.literal("work-order"),
  ...base,
  company: z.string().trim().min(2, "Enter your company name").max(150),
  reference: z.string().trim().max(100).optional().default(""), // loan / property / PO number
  dueDate: z.string().trim().max(20).optional().default(""),
  access: z.string().trim().max(300).optional().default(""), // lockbox code, gate code, tenant contact
});

export const leadSchema = z.discriminatedUnion("kind", [estimateSchema, workOrderSchema]);
export type Lead = z.infer<typeof leadSchema>;

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};
