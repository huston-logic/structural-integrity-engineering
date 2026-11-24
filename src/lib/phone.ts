/**
 * A tel: link for a displayed phone number. A 10-digit number is taken as North American and gets +1; a number written
 * with a leading + keeps its own country code. Returns null when there are too few digits to dial.
 */
export function telHref(display: string): string | null {
  const digits = display.replace(/\D/g, "");
  if (display.trim().startsWith("+")) return digits.length >= 8 ? `tel:+${digits}` : null;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return null;
}
