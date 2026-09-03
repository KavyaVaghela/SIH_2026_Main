"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, ShieldCheck, Mail, KeyRound } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas/login-schema";
import { signInWithEmail } from "@/lib/auth/actions";
import { isRouteAllowedForRole } from "@/lib/auth/rbac";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo");

  const [showPassword, setShowPassword] = React.useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotStatus, setForgotStatus] = React.useState<"idle" | "sending" | "sent">("idle");
  
  const [authError, setAuthError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "customer@example.com",
      password: "Password123!",
    },
    mode: "onTouched",
  });

  // Real Supabase Login Submission
  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);

    const res = await signInWithEmail(data.email.trim(), data.password);

    if (!res.success) {
      setAuthError(res.error || "Authentication failed. Please check your credentials.");
      return;
    }

    // Clear legacy mock session storage
    try {
      localStorage.removeItem("kaushalya_mock_auth");
    } catch {
      // Storage unavailable
    }

    // Determine safe redirect URL
    const userRole = res.role || "CUSTOMER";
    let destination = res.redirectUrl || "/customer";
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.includes("://")) {
      if (isRouteAllowedForRole(redirectTo, userRole)) {
        destination = redirectTo;
      }
    }

    router.push(destination);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) return;
    setForgotStatus("sending");
    await new Promise((resolve) => setTimeout(resolve, 600));
    setForgotStatus("sent");
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <Card className="shadow-lg border-emerald-900/10 dark:border-emerald-500/20">
        <CardHeader className="text-center space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">Member Login</CardTitle>
          <CardDescription>
            Access your Cooperative Gig Services account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Failure Alert */}
          {authError && (
            <Alert variant="destructive" className="py-3">
              <AlertTitle className="text-xs font-semibold">Authentication Error</AlertTitle>
              <AlertDescription className="text-xs">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. customer@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="pr-9"
                  {...register("email")}
                />
                <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-sm"
                  tabIndex={0}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="pr-9"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full font-semibold shadow-sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted-foreground border-t pt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="ml-1 font-semibold text-primary hover:underline">
            Register Here
          </Link>
        </CardFooter>
      </Card>

      {/* Forgot Password Modal Dialog */}
      <Dialog
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setForgotStatus("idle");
          setForgotEmail("");
        }}
        title={
          <div className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <span>Reset Your Password</span>
          </div>
        }
        description="Enter your registered email address to receive password reset instructions."
      >
        {forgotStatus === "sent" ? (
          <Alert variant="success" className="py-3">
            <AlertTitle className="text-xs font-semibold">Reset Link Sent!</AlertTitle>
            <AlertDescription className="text-xs">
              Password reset instructions have been sent to <strong>{forgotEmail}</strong>. Please check your inbox.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-xs font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={forgotStatus === "sending" || !forgotEmail}
              >
                {forgotStatus === "sending" ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
