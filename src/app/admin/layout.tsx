import { AdminNav } from "@/components/admin/AdminNav";
import { requirePageUser } from "@/lib/page-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["admin"], "/admin");

  return (
    <div className="container-page py-5 sm:py-8">
      <AdminNav />
      <div className="mt-5">{children}</div>
    </div>
  );
}
