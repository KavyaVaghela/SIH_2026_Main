import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function RegisterView() {
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl">Cooperative Registration</CardTitle>
        <CardDescription>
          Join as a Household Customer or Cooperative Worker Member
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Full Name</label>
          <Input placeholder="Enter your full legal name" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Registration Role</label>
          <Select>
            <option value="CUSTOMER">Household Customer</option>
            <option value="WORKER">Cooperative Worker Member</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Mobile Phone</label>
          <Input placeholder="+91 98765 43210" />
        </div>
        <Button className="w-full">Proceed to Verification</Button>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground border-t pt-4">
        Already registered? <Link href="/login" className="ml-1 font-semibold text-primary underline">Sign In</Link>
      </CardFooter>
    </Card>
  );
}
