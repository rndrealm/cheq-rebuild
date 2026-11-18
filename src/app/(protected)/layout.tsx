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
  if (!authed) redirect(AppRoutes.auth.path);

  const preloadedUser = await preloadAuthQuery(api.users.me);
  return <UserProvider preloadedUser={preloadedUser}>{children}</UserProvider>;
}
