/**
 * REAL reviews only (copied from Google with the customer's first name + initial).
 * Sections that show reviews are hidden while this list is empty.
 */
export type Review = { name: string; location: string; text: string; service?: string; source: "Google" | "Direct" };

export const reviews: Review[] = [];
