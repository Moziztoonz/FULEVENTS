"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { sendJson } from "@/lib/client";
import { cn, relativeTime } from "@/lib/utils";
import { Alert } from "../Alert";
import { Icon } from "../Icon";

export interface Attendee {
  id: string;
  ticket_code: string;
  status: string;
  registered_at: string;
  payment_confirmed_at: string | null;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  checked_in_at: string | null;
}

const filters = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked in" },
] as const;

export function AttendeeTable({
  eventId,
  ticketType,
  attendees,
}: {
  eventId: string;
  ticketType: string;
  attendees: Attendee[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return attendees.filter((row) => {
      if (filter === "checked_in" && !row.checked_in_at) return false;
      if (filter === "pending_payment" && row.status !== "pending_payment") return false;
      if (filter === "confirmed" && row.status !== "confirmed") return false;
      if (!term) return true;
      return (
        row.student_name.toLowerCase().includes(term) ||
        row.student_email.toLowerCase().includes(term) ||
        row.ticket_code.toLowerCase().includes(term)
      );
    });
  }, [attendees, filter, query]);

  async function setPayment(registrationId: string, status: "confirmed" | "pending_payment") {
    setBusy(registrationId);
    setError(null);
    const result = await sendJson(`/api/registrations/${registrationId}/payment`, "POST", { status });
    setBusy(null);
    if (!result.ok) {
      setError(result.data.error ?? "We could not update that payment.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                filter === option.value ? "bg-ink text-white" : "bg-page text-ink-soft hover:bg-[#e8ece6]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a student or code"
            className="input py-1.5 text-sm sm:w-56"
            aria-label="Search attendees"
          />
          <a href={`/api/events/${eventId}/attendees`} className="btn btn-secondary btn-sm shrink-0" download>
            <Icon name="download" size={14} /> CSV
          </a>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          {attendees.length === 0
            ? "No one has registered yet. Share the event link to get things moving."
            : "No attendees match this filter."}
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {visible.map((row) => (
              <li key={row.id} className="rounded-2xl border border-line bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{row.student_name}</p>
                    <p className="truncate text-xs text-muted">{row.student_email}</p>
                  </div>
                  <span
                    className={cn(
                      "chip shrink-0",
                      row.status === "confirmed" ? "badge-green" : row.status === "pending_payment" ? "badge-amber" : "badge-neutral",
                    )}
                  >
                    {row.status === "confirmed" ? "Paid" : row.status === "pending_payment" ? "Pending" : "Cancelled"}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[0.7rem] text-ink-soft">{row.ticket_code}</p>
                <p className="text-xs text-muted">
                  Registered {relativeTime(row.registered_at)}
                  {row.checked_in_at ? " · Checked in" : ""}
                </p>
                {ticketType === "paid" && row.status !== "cancelled" && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-2"
                    disabled={busy === row.id}
                    onClick={() => setPayment(row.id, row.status === "confirmed" ? "pending_payment" : "confirmed")}
                  >
                    {row.status === "confirmed" ? "Mark pending" : "Confirm payment"}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-page text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Ticket</th>
                  <th className="px-4 py-3 font-semibold">Registered</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Check-in</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{row.student_name}</p>
                      <p className="text-xs text-muted">{row.student_email}</p>
                      {row.student_phone && <p className="text-xs text-muted">{row.student_phone}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{row.ticket_code}</td>
                    <td className="px-4 py-3 text-xs text-muted">{relativeTime(row.registered_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "chip",
                          row.status === "confirmed" ? "badge-green" : row.status === "pending_payment" ? "badge-amber" : "badge-neutral",
                        )}
                      >
                        {row.status === "confirmed" ? "Confirmed" : row.status === "pending_payment" ? "Pending" : "Cancelled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {row.checked_in_at ? relativeTime(row.checked_in_at) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ticketType === "paid" && row.status !== "cancelled" ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={busy === row.id}
                          onClick={() => setPayment(row.id, row.status === "confirmed" ? "pending_payment" : "confirmed")}
                        >
                          {row.status === "confirmed" ? "Mark pending" : "Confirm"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-xs text-muted">
        Showing {visible.length} of {attendees.length} registration{attendees.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
