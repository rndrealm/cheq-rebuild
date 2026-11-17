import { redirect } from "next/navigation";
import { isAuthenticated, preloadAuthQuery } from "@/lib/convex";
import { api } from "../../../convex/_generated/api";
import { UserProvider } from "@/components/providers/user-provider";
import { AppRoutes } from "@/lib/routes";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  // Sign-in rather than sign-up: whoever lands here without a session is most
  // often a returning user (signed out, or the session expired). Sign-in links
  // to sign-up for new people.
  if (!authed) redirect(AppRoutes.signIn.path);

  const preloadedUser = await preloadAuthQuery(api.users.me);
  return <UserProvider preloadedUser={preloadedUser}>{children}</UserProvider>;
}
