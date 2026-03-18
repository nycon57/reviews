/**
 * Merge field definitions and replacement logic for email templates.
 * Fields use {{field_name}} syntax, replaced at render time.
 */

export interface MergeFieldDefinition {
  key: string;
  label: string;
  category: "customer" | "professional" | "organization" | "links";
  example: string;
}

export const MERGE_FIELDS: MergeFieldDefinition[] = [
  // Customer
  { key: "customer_name", label: "Customer Name", category: "customer", example: "John Smith" },
  { key: "customer_first_name", label: "First Name", category: "customer", example: "John" },
  { key: "customer_email", label: "Customer Email", category: "customer", example: "john@example.com" },

  // Professional
  { key: "professional_name", label: "Professional Name", category: "professional", example: "Jane Doe" },
  { key: "professional_first_name", label: "Professional First Name", category: "professional", example: "Jane" },
  { key: "professional_photo_url", label: "Professional Photo", category: "professional", example: "https://placehold.co/80x80" },

  // Organization
  { key: "company_name", label: "Company Name", category: "organization", example: "Acme Corp" },
  { key: "company_logo_url", label: "Company Logo", category: "organization", example: "https://placehold.co/200x60" },

  // Links
  { key: "survey_link", label: "Survey Link", category: "links", example: "https://app.repwell.ai/s/abc123" },
  { key: "review_link", label: "Review Link", category: "links", example: "https://app.repwell.ai/r/abc123" },
  { key: "unsubscribe_link", label: "Unsubscribe", category: "links", example: "#" },
];

export const MERGE_FIELD_EXAMPLES: Record<string, string> = Object.fromEntries(
  MERGE_FIELDS.map((f) => [f.key, f.example])
);

const MERGE_FIELD_PATTERN = /\{\{(\w+)\}\}/;

/** Replace {{field_name}} in a string with values from the map. */
export function replaceMergeFields(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(
    new RegExp(MERGE_FIELD_PATTERN.source, "g"),
    (match, key: string) => values[key] ?? match
  );
}

/** Walk block props and replace merge fields in all string values. */
export function replaceMergeFieldsInProps(
  props: Record<string, unknown>,
  values: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string") {
      result[key] = replaceMergeFields(value, values);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Extract unique merge field keys used in document blocks. */
export function extractMergeFields(
  blocks: Array<{ props: Record<string, unknown>; children?: unknown[] }>
): string[] {
  const fields = new Set<string>();

  function walk(block: { props: Record<string, unknown>; children?: unknown[] }) {
    for (const value of Object.values(block.props)) {
      if (typeof value === "string") {
        let match: RegExpExecArray | null;
        const regex = new RegExp(MERGE_FIELD_PATTERN.source, "g");
        while ((match = regex.exec(value)) !== null) {
          fields.add(match[1]);
        }
      }
    }
    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        walk(child as { props: Record<string, unknown>; children?: unknown[] });
      }
    }
  }

  for (const block of blocks) {
    walk(block);
  }
  return Array.from(fields);
}
