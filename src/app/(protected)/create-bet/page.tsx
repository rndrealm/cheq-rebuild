"use client";

import { useRouter } from "next/navigation";
import { CreateBetForm } from "@/components/create-bet-form";
import { AppRoutes } from "@/lib/routes";

export default function CreateBetPage() {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-79.25 items-center ">
      <CreateBetForm onCreated={() => router.replace(AppRoutes.home.path)} />
    </div>
  );
}
