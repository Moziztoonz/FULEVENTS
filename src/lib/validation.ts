import { z } from "zod";
import { CATEGORIES } from "./utils";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isNigerianPhone(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.startsWith("234")) return digits.length === 13;
  if (digits.startsWith("0")) return digits.length === 11;
  return digits.length >= 10 && digits.length <= 15;
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(160, "That email address is too long.")
  .email("Enter a valid email address, like ada@example.com.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Your password needs at least 8 characters.")
  .max(100, "That password is too long.");

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Enter your full name.")
      .max(80, "That name is too long."),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((value) => value === "" || isNigerianPhone(value), {
        message: "Enter a valid phone number, like 0803 123 4567.",
      }),
    password: passwordSchema,
    role: z.enum(["student", "organizer"], {
      errorMap: () => ({ message: "Choose Student or Event Organizer." }),
    }),
    organizationName: z.string().trim().max(100).optional().default(""),
    contactPhone: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.role === "organizer") {
      if (data.organizationName.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["organizationName"],
          message: "Tell us your club or organisation name.",
        });
      }
      if (!data.contactPhone || !isNigerianPhone(data.contactPhone)) {
        ctx.addIssue({
          code: "custom",
          path: ["contactPhone"],
          message: "Organisers need a phone number students can reach.",
        });
      }
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z.object({
  token: z.string().min(10, "This reset link is incomplete."),
  password: passwordSchema,
});

const categoryValues = CATEGORIES.map((c) => c.value) as [string, ...string[]];

export const eventInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Give the event a title of at least 4 characters.")
      .max(120, "Keep the title under 120 characters."),
    category: z.enum(categoryValues, { errorMap: () => ({ message: "Choose a category." }) }),
    description: z
      .string()
      .trim()
      .min(30, "Describe the event in at least 30 characters so students know what to expect.")
      .max(4000, "That description is too long."),
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the event date."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time."),
    venue: z
      .string()
      .trim()
      .min(3, "Where on campus is this happening?")
      .max(120, "Keep the venue name short."),
    ticketType: z.enum(["free", "paid"], { errorMap: () => ({ message: "Choose Free or Paid." }) }),
    price: z.string().optional().default(""),
    capacity: z.string().optional().default(""),
    registrationDeadline: z.string().optional().default(""),
    contactType: z.string().optional().default(""),
    contactValue: z.string().trim().optional().default(""),
    contactPhone: z.string().trim().optional().default(""),
    contactEmail: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    if (data.eventDate < today) {
      ctx.addIssue({ code: "custom", path: ["eventDate"], message: "The event date cannot be in the past." });
    }
    if (data.endTime <= data.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "The end time must be after the start time.",
      });
    }
    if (data.registrationDeadline) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.registrationDeadline)) {
        ctx.addIssue({
          code: "custom",
          path: ["registrationDeadline"],
          message: "Enter the deadline as a date.",
        });
      } else if (data.registrationDeadline > data.eventDate) {
        ctx.addIssue({
          code: "custom",
          path: ["registrationDeadline"],
          message: "The deadline must be on or before the event date.",
        });
      }
    }
    if (data.capacity) {
      const capacity = Number(data.capacity);
      if (!Number.isInteger(capacity) || capacity < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["capacity"],
          message: "Enter a whole number of tickets, or leave it empty for unlimited.",
        });
      }
    }
    if (data.ticketType === "paid") {
      const price = Number(data.price);
      if (!data.price || !Number.isFinite(price) || price <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Enter the ticket price in Naira.",
        });
      } else if (price > 1_000_000) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "That price looks too high." });
      } else if (!Number.isInteger(price)) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Use whole Naira, no kobo." });
      }
      if (!data.contactType || !["whatsapp", "phone", "website"].includes(data.contactType)) {
        ctx.addIssue({
          code: "custom",
          path: ["contactType"],
          message: "Choose how students should contact you to pay.",
        });
      }
      if (!data.contactValue) {
        ctx.addIssue({
          code: "custom",
          path: ["contactValue"],
          message: "Add the number or link students should use.",
        });
      } else if (data.contactType === "website") {
        try {
          const url = new URL(data.contactValue);
          if (!["http:", "https:"].includes(url.protocol)) throw new Error("bad protocol");
        } catch {
          ctx.addIssue({
            code: "custom",
            path: ["contactValue"],
            message: "Enter a full website link starting with https://",
          });
        }
      } else if (!isNigerianPhone(data.contactValue)) {
        ctx.addIssue({
          code: "custom",
          path: ["contactValue"],
          message: "Enter a valid phone number for payments.",
        });
      }
    }
    if (data.contactPhone && !isNigerianPhone(data.contactPhone)) {
      ctx.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "Enter a valid contact phone number.",
      });
    }
    if (data.contactEmail && !z.string().email().safeParse(data.contactEmail).success) {
      ctx.addIssue({
        code: "custom",
        path: ["contactEmail"],
        message: "Enter a valid contact email.",
      });
    }
  });

export type EventInput = z.infer<typeof eventInputSchema>;

export const reportSchema = z.object({
  eventId: z.string().min(1),
  reason: z.enum(["scam", "inappropriate", "misleading", "duplicate", "other"], {
    errorMap: () => ({ message: "Choose a reason for the report." }),
  }),
  details: z.string().trim().max(1000, "Keep the details under 1000 characters.").optional().default(""),
});

export const checkInSchema = z.object({
  eventId: z.string().min(1, "Choose the event first."),
  code: z.string().trim().min(4, "Enter the ticket code.").max(40, "That code is too long."),
});
