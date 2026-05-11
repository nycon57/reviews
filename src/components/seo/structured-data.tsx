/**
 * Component to render JSON-LD structured data
 *
 * JSON-LD is rendered as script text with explicit escaping for script-breaking
 * characters to prevent XSS via payloads like </script><script>...</script>.
 */

function safeJsonLdStringify(data: object | object[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function schemaKey(schema: object): string {
  return safeJsonLdStringify(schema);
}

interface StructuredDataProps {
  data: object | object[];
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonString = safeJsonLdStringify(data);

  return <script type="application/ld+json">{jsonString}</script>;
}

interface MultiSchemaProps {
  schemas: object[];
}

export function MultiSchemaStructuredData({ schemas }: MultiSchemaProps) {
  if (schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema) => {
        const jsonString = safeJsonLdStringify(schema);

        return (
          <script key={schemaKey(schema)} type="application/ld+json">
            {jsonString}
          </script>
        );
      })}
    </>
  );
}
