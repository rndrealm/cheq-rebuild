import Link from "next/link";
import { AppRoutes } from "@/lib/routes";

/**
 * Sign-up's footer: a link to sign in and the terms line; on the welcome
 * step, the legal disclaimer instead (Figma), grey on the white page.
 */
export function SignUpFooter({ welcome }: { welcome: boolean }) {
  if (welcome) {
    return (
      <p className="mx-auto max-w-[432px] text-xs leading-[15px] text-[#8c8c8c]">
        Cheq is a technology and skill-based gaming platform, not a bank or
        licensed financial institution. Funds held in your Cheq wallet are
        subject to our{" "}
        <span className="font-medium text-[#0b0b0b] underline">
          Terms of Service
        </span>{" "}
        and are not insured against match losses. Participation is strictly
        limited to users 18 years of age or older in eligible jurisdictions.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p>
        Already have an account?{" "}
        <Link href={AppRoutes.signIn.path} className="font-medium underline outline-none">
          Sign in
        </Link>
      </p>
      <p>
        By signing up you agree to our{" "}
        <span className="font-medium underline">Terms of service</span>
      </p>
    </div>
  );
}
