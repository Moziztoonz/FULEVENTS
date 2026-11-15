import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/ResetForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you will remember, at least 8 characters.">
      <ResetForm token={token ?? ""} />
    </AuthShell>
  );
}
