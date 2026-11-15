import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell, AuthFootnote } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "organizer" ? "/organizer" : user.role === "admin" ? "/admin" : "/tickets");
  }
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your tickets and the events you saved."
      footer={<AuthFootnote text="No account yet?" linkLabel="Create one in a minute" href="/register" />}
    >
      <LoginForm next={safeNext} />
    </AuthShell>
  );
}
