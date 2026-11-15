import { OrganizerNav } from "@/components/organizer/OrganizerNav";
import { requirePageUser } from "@/lib/page-auth";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["organizer", "admin"], "/organizer");

  return (
    <div className="container-page py-5 sm:py-8">
      <OrganizerNav />
      <div className="mt-5">{children}</div>
    </div>
  );
}
