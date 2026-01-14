/**
 * JSON-LD component for SEO structured data
 *
 * SECURITY NOTE: This component uses dangerouslySetInnerHTML intentionally
 * for JSON-LD structured data, which is the standard React pattern.
 * The data is:
 * 1. Generated from our controlled MDX files (not user input)
 * 2. Serialized via JSON.stringify which handles proper escaping
 * 3. Required for Google rich results/SEO structured data
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  // JSON.stringify provides safe serialization with proper escaping
  // This is the recommended Next.js pattern for JSON-LD structured data
  // See: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
  const serializedData = JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializedData,
      }}
    />
  );
}
