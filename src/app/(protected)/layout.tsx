import { redirect } from "next/navigation";
import { isAuthenticated, preloadAuthQuery } from "@/lib/convex";
import { api } from "../../../convex/_generated/api";
import { UserProvider } from "@/components/providers/user-provider";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/sign-up");

  const preloadedUser = await preloadAuthQuery(api.users.me);
  return <UserProvider preloadedUser={preloadedUser}>{children}</UserProvider>;
}
