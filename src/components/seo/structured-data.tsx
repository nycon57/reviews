/**
 * Component to render JSON-LD structured data
 *
 * This uses dangerouslySetInnerHTML with explicit escaping for script-breaking
 * characters to prevent XSS via payloads like </script><script>...</script>.
 */

function safeJsonLdStringify(data: object | object[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

interface StructuredDataProps {
  data: object | object[];
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonString = safeJsonLdStringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonString,
      }}
    />
  );
}

interface MultiSchemaProps {
  schemas: object[];
}

export function MultiSchemaStructuredData({ schemas }: MultiSchemaProps) {
  if (schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema, index) => {
        const jsonString = safeJsonLdStringify(schema);

        return (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonString,
            }}
          />
        );
      })}
    </>
  );
}
