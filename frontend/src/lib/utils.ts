/**
 * Format a raw booking ID (CUID) into a pretty ticket ID.
 * Example: "clx1234567890abcdef" → "EF-1234-ABCD"
 */
export function formatTicketId(rawId: string): string {
  if (!rawId || rawId.length < 8) return rawId;
  const chars = rawId.slice(0, 8).toUpperCase();
  return `EF-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}