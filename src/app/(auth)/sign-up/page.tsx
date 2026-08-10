"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppRoutes } from "@/lib/routes";

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        username,
        name: username,
      });
      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
      } else {
        router.push("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-h1 font-bold leading-12.5 text-fg-base">
          Create your account
        </h1>
        <p className="text-base text-fg-400">
          Join Cheq and start making predictions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            minLength={8}
          />
          <p className="text-footnote text-fg-300">
            Must be at least 8 characters
          </p>
        </div>

        {error && <p className="text-caption text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} size="lg" className="mt-2">
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-caption text-fg-400">
        Already have an account?{" "}
        <Link
          href={AppRoutes.signIn.path}
          className="font-bold text-fg-base hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
