import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/events");
  const { role } = await searchParams;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Students get tickets in seconds. Organisers get a dashboard to run events."
    >
      <RegisterForm initialRole={role === "organizer" ? "organizer" : "student"} />
    </AuthShell>
  );
}
