"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { compressImage, sendForm } from "@/lib/client";
import { CATEGORIES, cn, todayISO } from "@/lib/utils";
import { Alert } from "../Alert";
import { Icon } from "../Icon";

export interface EventFormValues {
  id?: string;
  title: string;
  category: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  ticketType: "free" | "paid";
  price: string;
  capacity: string;
  registrationDeadline: string;
  contactType: string;
  contactValue: string;
  contactPhone: string;
  contactEmail: string;
  flyerPath: string | null;
}

const EMPTY: EventFormValues = {
  title: "",
  category: "academic",
  description: "",
  eventDate: "",
  startTime: "10:00",
  endTime: "12:00",
  venue: "",
  ticketType: "free",
  price: "",
  capacity: "",
  registrationDeadline: "",
  contactType: "whatsapp",
  contactValue: "",
  contactPhone: "",
  contactEmail: "",
  flyerPath: null,
};

export function EventForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Partial<EventFormValues>;
}) {
  const router = useRouter();
  const values = { ...EMPTY, ...initial };
  const [ticketType, setTicketType] = useState<"free" | "paid">(values.ticketType);
  const [preview, setPreview] = useState<string | null>(
    values.flyerPath ? `/api/files/${values.flyerPath}` : null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"draft" | "publish" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    setFileError(null);
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setFileError("Use a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setFileError("That image is larger than 5MB. Try a smaller one.");
      event.target.value = "";
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function submit(action: "draft" | "publish") {
    setBusy(action);
    setError(null);
    setFields({});

    const formElement = document.getElementById("event-form") as HTMLFormElement | null;
    if (!formElement) return;
    const formData = new FormData(formElement);
    formData.set("ticketType", ticketType);
    formData.set("action", action);

    if (file) {
      const compressed = await compressImage(file);
      formData.set("flyer", compressed, compressed.name);
    }

    const url = mode === "create" ? "/api/events" : `/api/events/${values.id}`;
    const result = await sendForm<{ id?: string }>(url, formData, mode === "create" ? "POST" : "PATCH");
    setBusy(null);

    if (!result.ok) {
      setError(result.data.error ?? "We could not save this event.");
      setFields(result.data.fields ?? {});
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.scrollIntoView({ block: "center" });
      });
      return;
    }

    const id = result.data.id ?? values.id;
    router.push(`/organizer/events/${id}${action === "publish" ? "?published=1" : ""}`);
    router.refresh();
  }

  const err = (key: string) => (fields[key] ? <p className="field-error">{fields[key]}</p> : null);

  return (
    <form
      id="event-form"
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit("publish");
      }}
      noValidate
    >
      {error && <Alert variant="error">{error}</Alert>}

      <section className="card p-5">
        <h2 className="text-lg font-semibold">The basics</h2>
        <p className="mt-0.5 text-sm text-muted">Students see this first, so make it clear and specific.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className="label">
              Event title
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={values.title}
              placeholder="e.g. Faculty of Science Career Fair"
              className="input"
              aria-invalid={fields.title ? "true" : undefined}
            />
            {err("title")}
          </div>

          <div>
            <label htmlFor="category" className="label">
              Category
            </label>
            <select id="category" name="category" defaultValue={values.category} className="select" aria-invalid={fields.category ? "true" : undefined}>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {err("category")}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              defaultValue={values.description}
              rows={6}
              placeholder="What is happening, who is it for, and what should students bring or expect?"
              className="textarea"
              aria-invalid={fields.description ? "true" : undefined}
            />
            <p className="hint">At least 30 characters. Write it the way you would tell a friend.</p>
            {err("description")}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">When and where</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="eventDate" className="label">
              Event date
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              required
              min={todayISO()}
              defaultValue={values.eventDate}
              className="input"
              aria-invalid={fields.eventDate ? "true" : undefined}
            />
            {err("eventDate")}
          </div>
          <div>
            <label htmlFor="startTime" className="label">
              Start time
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={values.startTime}
              className="input"
              aria-invalid={fields.startTime ? "true" : undefined}
            />
            {err("startTime")}
          </div>
          <div>
            <label htmlFor="endTime" className="label">
              End time
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue={values.endTime}
              className="input"
              aria-invalid={fields.endTime ? "true" : undefined}
            />
            {err("endTime")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="venue" className="label">
              Campus venue
            </label>
            <input
              id="venue"
              name="venue"
              required
              defaultValue={values.venue}
              placeholder="e.g. 1000 Capacity Lecture Theatre, Permanent Site"
              className="input"
              aria-invalid={fields.venue ? "true" : undefined}
            />
            {err("venue")}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Tickets</h2>
        <p className="mt-0.5 text-sm text-muted">
          Free events get instant tickets. For paid events, students pay you directly, then you confirm.
        </p>

        <fieldset className="mt-4">
          <legend className="label">Ticket type</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                { value: "free", label: "Free", body: "No payment needed" },
                { value: "paid", label: "Paid", body: "Pay organiser directly" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTicketType(option.value)}
                aria-pressed={ticketType === option.value}
                className={cn(
                  "rounded-2xl border p-3 text-left",
                  ticketType === option.value
                    ? "border-brand bg-brand-soft/70 ring-1 ring-brand"
                    : "border-line bg-white hover:border-brand-ring",
                )}
              >
                <span className="block text-sm font-bold text-ink">{option.label}</span>
                <span className="block text-xs text-muted">{option.body}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="ticketType" value={ticketType} />
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {ticketType === "paid" && (
            <>
              <div>
                <label htmlFor="price" className="label">
                  Ticket price (₦)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min={1}
                  step={50}
                  required
                  defaultValue={values.price}
                  placeholder="2000"
                  className="input"
                  aria-invalid={fields.price ? "true" : undefined}
                />
                {err("price")}
              </div>
              <div>
                <label htmlFor="contactType" className="label">
                  How students should pay
                </label>
                <select
                  id="contactType"
                  name="contactType"
                  defaultValue={values.contactType}
                  className="select"
                  aria-invalid={fields.contactType ? "true" : undefined}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone call</option>
                  <option value="website">Website link</option>
                </select>
                {err("contactType")}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contactValue" className="label">
                  Contact to buy ticket
                </label>
                <input
                  id="contactValue"
                  name="contactValue"
                  required
                  defaultValue={values.contactValue}
                  placeholder={values.contactType === "website" ? "https://…" : "0803 123 4567"}
                  className="input"
                  aria-invalid={fields.contactValue ? "true" : undefined}
                />
                <p className="hint">Students use this to reach you and pay outside the platform.</p>
                {err("contactValue")}
              </div>
            </>
          )}

          <div>
            <label htmlFor="capacity" className="label">
              Available tickets <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              defaultValue={values.capacity}
              placeholder="Leave empty for no limit"
              className="input"
              aria-invalid={fields.capacity ? "true" : undefined}
            />
            {err("capacity")}
          </div>

          <div>
            <label htmlFor="registrationDeadline" className="label">
              Registration deadline <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="registrationDeadline"
              name="registrationDeadline"
              type="date"
              min={todayISO()}
              defaultValue={values.registrationDeadline}
              className="input"
              aria-invalid={fields.registrationDeadline ? "true" : undefined}
            />
            {err("registrationDeadline")}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">How students reach you</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactPhone" className="label">
              Contact phone
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              defaultValue={values.contactPhone}
              placeholder="0803 123 4567"
              className="input"
              aria-invalid={fields.contactPhone ? "true" : undefined}
            />
            {err("contactPhone")}
          </div>
          <div>
            <label htmlFor="contactEmail" className="label">
              Contact email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={values.contactEmail}
              placeholder="organiser@example.com"
              className="input"
              aria-invalid={fields.contactEmail ? "true" : undefined}
            />
            {err("contactEmail")}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Flyer</h2>
        <p className="mt-0.5 text-sm text-muted">JPG, PNG or WEBP up to 5MB. Large images are shrunk automatically.</p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-dashed border-line bg-page sm:w-72">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Flyer preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-center text-sm text-muted">
                <span className="flex flex-col items-center gap-1.5 p-4">
                  <Icon name="camera" size={22} />
                  No flyer yet
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <label htmlFor="flyer" className="label">
              {values.flyerPath ? "Replace flyer" : "Upload flyer"} {mode === "create" && <span className="text-danger">*</span>}
            </label>
            <input
              id="flyer"
              ref={fileInput}
              name="flyer"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="block w-full text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-dark hover:file:bg-[#d9ebe1]"
              aria-invalid={fields.flyer || fileError ? "true" : undefined}
            />
            {(fileError || fields.flyer) && <p className="field-error">{fileError ?? fields.flyer}</p>}
            <p className="hint">
              Portrait or landscape both work. Keep important text away from the edges so it survives cropping.
            </p>
          </div>
        </div>
      </section>

      <div className="sticky bottom-16 z-20 flex flex-col gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur sm:bottom-4 sm:flex-row sm:justify-end">
        <Link href="/organizer" className="btn btn-secondary order-2 sm:order-1">
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => submit("draft")}
          className="btn btn-secondary order-3 sm:order-2"
          disabled={busy !== null}
        >
          {busy === "draft" ? "Saving…" : "Save as draft"}
        </button>
        <button type="submit" className="btn btn-primary order-1 sm:order-3" disabled={busy !== null}>
          {busy === "publish" ? "Publishing…" : mode === "create" ? "Publish event" : "Save and publish"}
        </button>
      </div>
    </form>
  );
}
