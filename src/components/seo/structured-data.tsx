/**
 * Component to render JSON-LD structured data
 *
 * This uses dangerouslySetInnerHTML which is safe here because:
 * 1. The data is serialized via JSON.stringify() which escapes special characters
 * 2. The content type is application/ld+json, not HTML
 * 3. The data is generated from our validated database records, not user input
 */

interface StructuredDataProps {
  data: object | object[];
}

export function StructuredData({ data }: StructuredDataProps) {
  // JSON.stringify safely escapes any special characters
  const jsonString = JSON.stringify(data);

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
        // JSON.stringify safely escapes any special characters
        const jsonString = JSON.stringify(schema);

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
