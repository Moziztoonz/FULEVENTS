import { digitsOnly } from "./validation";
import type { ContactType } from "./types";

export function toInternationalDigits(value: string): string {
  const digits = digitsOnly(value);
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

/** Builds a safe link for the "contact to buy" option. Returns null if invalid. */
export function contactHref(
  type: ContactType | null | undefined,
  value: string | null | undefined,
  eventTitle = "",
): string | null {
  if (!type || !value) return null;
  if (type === "website") {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) return null;
      return url.toString();
    } catch {
      return null;
    }
  }
  const digits = toInternationalDigits(value);
  if (digits.length < 10) return null;
  if (type === "whatsapp") {
    const message = encodeURIComponent(`Hello, I want to buy a ticket for "${eventTitle}" on Campus Events FULAFIA.`);
    return `https://wa.me/${digits}?text=${message}`;
  }
  return `tel:+${digits}`;
}

export function contactLabel(type: ContactType | null | undefined): string {
  if (type === "whatsapp") return "Message on WhatsApp";
  if (type === "phone") return "Call the organiser";
  if (type === "website") return "Open ticket page";
  return "Contact organiser";
}

export function formatPhone(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return value;
}
