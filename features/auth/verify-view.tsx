"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = searchParams.get("role")?.toUpperCase() || "CUSTOMER";
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "9876543210";
  const redirectUrl = searchParams.get("redirectUrl");

  const [otpCode, setOtpCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const DEMO_OTP = "123456";

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsVerifying(true);

    // Simulate verification latency
    setTimeout(() => {
      setIsVerifying(false);
      // In development prototype, accept 123456 or 940218 or any 6-digit valid numeric code
      if (/^\d{6}$/.test(cleanOtp)) {
        setIsVerified(true);
      } else {
        setErrorMessage("Invalid OTP. Please use code '123456' for prototype testing.");
      }
    }, 600);
  };

  const handleQuickAutofill = () => {
    setOtpCode(DEMO_OTP);
    setErrorMessage(null);
  };

  // SUCCESS OUTCOME VIEW
  if (isVerified) {
    if (role === "WORKER") {
      return (
        <Card className="w-full max-w-md shadow-lg border-amber-500/20 text-center">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold">Worker Application Registered</CardTitle>
            <CardDescription>
              Your contact details are verified. Application is queued for Federation Review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 py-1 px-3 text-xs font-semibold">
              Status: PENDING_FEDERATION_APPROVAL
            </Badge>
            <Alert variant="info" className="text-left text-xs py-2.5">
              <AlertTitle className="text-xs font-semibold">Next Steps</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Your Federation Administrator will review your skills and credentials. You can monitor your onboarding status anytime.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button className="w-full font-semibold" onClick={() => router.push("/pending")}>
              View Application Status
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    if (role === "FEDERATION_ADMIN") {
      return (
        <Card className="w-full max-w-md shadow-lg border-amber-500/20 text-center">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold">Federation Registration Submitted</CardTitle>
            <CardDescription>
              Entity details verified. Application is awaiting Super Admin approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 py-1 px-3 text-xs font-semibold">
              Status: PENDING_SUPER_ADMIN_APPROVAL
            </Badge>
            <Alert variant="info" className="text-left text-xs py-2.5">
              <AlertTitle className="text-xs font-semibold">Cooperative Federation Review</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                The platform Super Administrator will verify society registration records before activating the federation portal.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button className="w-full font-semibold" onClick={() => router.push("/pending")}>
              Check Society Review Status
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    // Default: Customer
    return (
      <Card className="w-full max-w-md shadow-lg border-emerald-500/20 text-center">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">Mobile Number Verified!</CardTitle>
          <CardDescription>
            Your customer profile is active and ready for booking household services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 py-1 px-3 text-xs font-semibold">
            Status: ACTIVE & VERIFIED
          </Badge>
          <p className="text-xs text-muted-foreground">
            {email ? `Account registered for ${email}` : "You can now sign in to your customer dashboard."}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            className="w-full font-semibold"
            onClick={() => router.push(redirectUrl || "/login?verified=true")}
          >
            Proceed to Login <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // OTP ENTRY VIEW
  return (
    <Card className="w-full max-w-md shadow-lg text-center">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Simulated OTP Verification</CardTitle>
        <CardDescription className="text-xs">
          Enter the 6-digit verification code sent to <span className="font-semibold text-foreground">+91 {phone}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prototype Demo Information Banner */}
        <Alert variant="info" className="py-2.5 px-3 text-left">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <AlertTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Prototype Development Mode
              </AlertTitle>
              <AlertDescription className="text-[11px] text-muted-foreground">
                No third-party SMS cost required. Test code is <span className="font-mono font-bold text-foreground">123456</span>.
              </AlertDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2 font-medium"
              onClick={handleQuickAutofill}
            >
              Autofill
            </Button>
          </div>
        </Alert>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <Input
              id="otp-input"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center font-mono text-2xl tracking-[0.4em] font-semibold h-12"
              placeholder="••••••"
              maxLength={6}
              autoFocus
            />
            {errorMessage && (
              <p className="text-xs text-destructive text-center font-medium mt-1">
                {errorMessage}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full font-semibold h-10"
            disabled={isVerifying || otpCode.length < 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Code...
              </>
            ) : (
              <>
                Verify Code <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t pt-3 pb-4 text-xs text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          <span>Didn&apos;t receive code?</span>
          <button
            type="button"
            onClick={handleQuickAutofill}
            className="text-primary hover:underline font-semibold"
          >
            Resend / Autofill
          </button>
        </div>
        <Link href="/login" className="hover:underline mt-1">
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}

export function VerifyView() {
  return (
    <React.Suspense
      fallback={
        <Card className="w-full max-w-md shadow-md p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Loading verification portal...</p>
        </Card>
      }
    >
      <VerifyContent />
    </React.Suspense>
  );
}

