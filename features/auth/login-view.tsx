import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function LoginView() {
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl">Member Login</CardTitle>
        <CardDescription>
          Access your Cooperative Gig Services account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Mobile / Email</label>
          <Input placeholder="Enter registered phone or email" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Password</label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <Button className="w-full">Sign In</Button>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-4">
        <Link href="/register" className="hover:underline text-primary">Create Account</Link>
        <Link href="/pending" className="hover:underline">Check Pending Status</Link>
      </CardFooter>
    </Card>
  );
}
