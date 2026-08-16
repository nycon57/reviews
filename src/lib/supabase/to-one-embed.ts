/**
 * PostgREST returns a single row for a to-one embed, but the untyped client
 * cannot see FK cardinality and widens every embed to an array. Collapse either
 * shape back to the single joined row.
 */
export function toOneEmbed<TRow>(embed: TRow | TRow[]): TRow {
  return Array.isArray(embed) ? embed[0] : embed;
}
