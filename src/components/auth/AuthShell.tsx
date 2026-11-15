import Link from "next/link";
import { Brand } from "../Brand";
import { Icon } from "../Icon";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-stretch">
        <section className="relative hidden overflow-hidden rounded-3xl bg-brand p-9 text-white lg:flex lg:flex-col">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 15%, #7fd3a4 0, transparent 42%), radial-gradient(circle at 85% 80%, #d9f0c4 0, transparent 45%)",
            }}
          />
          <div className="relative flex h-full flex-col">
            <div className="text-white [&_span]:text-white">
              <Brand />
            </div>
            <div className="mt-auto space-y-5 pb-2">
              <h2 className="font-display text-[2.4rem] leading-[1.05] text-white">
                Everything happening on campus, in one place.
              </h2>
              <ul className="space-y-3 text-sm text-white/85">
                <li className="flex items-start gap-2.5">
                  <Icon name="calendar" size={18} className="mt-0.5 shrink-0" />
                  Find lectures, matches, concerts and career fairs without scrolling five group chats.
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="ticket" size={18} className="mt-0.5 shrink-0" />
                  Get a ticket with a QR code you can show at the gate.
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="users" size={18} className="mt-0.5 shrink-0" />
                  Organisers get an attendee list, check-in and CSV export.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="card mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold text-ink sm:text-[1.75rem]">{title}</h1>
            <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="mt-6 border-t border-line pt-5 text-sm text-muted">{footer}</div>}
        </section>
      </div>
    </div>
  );
}

export function AuthFootnote({ text, linkLabel, href }: { text: string; linkLabel: string; href: string }) {
  return (
    <p>
      {text}{" "}
      <Link href={href} className="font-semibold text-brand-dark underline-offset-4 hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}
