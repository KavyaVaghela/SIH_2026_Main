import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function VerifyView() {
  return (
    <Card className="w-full max-w-md shadow-md text-center">
      <CardHeader>
        <CardTitle className="text-2xl">OTP Verification</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to your mobile phone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input className="text-center font-mono text-lg tracking-widest" placeholder="••••••" maxLength={6} />
        <Button className="w-full">Verify Code</Button>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground border-t pt-4">
        <Link href="/login" className="hover:underline">Back to Login</Link>
      </CardFooter>
    </Card>
  );
}
