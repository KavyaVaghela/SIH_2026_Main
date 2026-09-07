import { Suspense } from "react";
import { LoginView } from "@/features/auth/login-view";

export const metadata = {
  title: "Member Login - Cooperative Gig Platform",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}


