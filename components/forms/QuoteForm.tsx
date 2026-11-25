import { getServices } from "@/lib/data/catalog";
import { LeadForm } from "./LeadForm";

/** Server wrapper: loads the published service list (cached) and renders the client form. */
export async function QuoteForm(props: { kind?: "estimate" | "work-order"; defaultService?: string; compact?: boolean }) {
  const services = await getServices();
  return <LeadForm {...props} serviceNames={services.map((s) => s.name)} />;
}
