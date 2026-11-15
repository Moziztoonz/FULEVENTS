import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import type { Role, SessionUser } from "./types";

/**
 * Page-level guard. Redirects guests to login with a return path, and users
 * with the wrong role to a page they can actually use.
 */
export async function requirePageUser(roles: Role[], returnTo = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  if (!roles.includes(user.role)) {
    redirect(user.role === "student" ? "/tickets" : "/");
  }
  return user;
}
