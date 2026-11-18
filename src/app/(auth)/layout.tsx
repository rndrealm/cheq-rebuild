import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/convex";
import { AppRoutes } from "@/lib/routes";

// The auth flow is for people without a session: anyone already signed in
// goes to the dashboard instead. Checked on the server when the page loads,
// so sign-up's welcome step (shown right after the account is created, without
// a reload) isn't affected; reloading it lands on the dashboard.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await isAuthenticated()) redirect(AppRoutes.home.path);
  return children;
}
