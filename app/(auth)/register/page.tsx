import { Suspense } from "react";
import { RegisterView } from "@/features/auth/register-view";

export const metadata = {
  title: "Register - Cooperative Gig Platform",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterView />
    </Suspense>
  );
}

