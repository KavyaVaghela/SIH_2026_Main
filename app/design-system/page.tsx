"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioItem } from "@/components/ui/radio";
import { Switch } from "@/components/ui/switch";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Dropdown } from "@/components/ui/dropdown";
import { Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar } from "@/components/ui/avatar";
import { ToastItem } from "@/components/ui/toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Pagination } from "@/components/ui/pagination";

import { StatusBadge } from "@/components/status/status-badge";
import { StatusTimeline } from "@/components/status/status-timeline";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { NotificationItem } from "@/components/data-display/notification-item";
import { Rating } from "@/components/data-display/rating";
import { WorkerCard } from "@/components/data-display/worker-card";
import { WorkerProfileCard } from "@/components/data-display/worker-profile-card";
import { BookingCard } from "@/components/data-display/booking-card";
import { Invoice } from "@/components/data-display/invoice";
import { PaymentSummary } from "@/components/data-display/payment-summary";
import { MapCard } from "@/components/data-display/map-card";
import { formatINR } from "@/lib/formatters/currency";

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [checked, setChecked] = React.useState(true);
  const [radioVal, setRadioVal] = React.useState("option1");
  const [switchVal, setSwitchVal] = React.useState(true);
  const [page, setPage] = React.useState(1);

  return (
    <AppShell userName="UI Architect" userRole="Design Lead">
      <PageHeader
        title="Shared UI Design System & Component Library"
        description="Standardized, accessible tokens and reusable components for the Cooperative Gig Services Platform."
        breadcrumbs={[{ label: "Design System", href: "/design-system" }, { label: "Component Catalog" }]}
        actions={
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Open Dialog Demo
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDrawerOpen(true)}>
              Open Drawer Demo
            </Button>
          </div>
        }
      />

      <div className="space-y-12 pb-16">
        {/* Section 1: Design Tokens & Currency */}
        <section>
          <SectionHeader title="1. Design Tokens & Currency Formatting (INR)" description="Theme colors, focus states, and INR formatters." />
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="p-3 bg-primary text-primary-foreground rounded-md text-xs font-semibold text-center">Primary Emerald</div>
            <div className="p-3 bg-secondary text-secondary-foreground rounded-md text-xs font-semibold text-center">Steel Secondary</div>
            <div className="p-3 bg-accent text-accent-foreground rounded-md text-xs font-semibold text-center">Amber Accent</div>
            <div className="p-3 bg-emerald-600 text-white rounded-md text-xs font-semibold text-center">Success Green</div>
            <div className="p-3 bg-amber-500 text-slate-950 rounded-md text-xs font-semibold text-center">Warning Amber</div>
            <div className="p-3 bg-destructive text-white rounded-md text-xs font-semibold text-center">Destructive Red</div>
          </div>
          <div className="mt-4 p-4 rounded-md border bg-card flex flex-wrap items-center justify-between gap-4 text-sm">
            <span>Standard Price: <strong>{formatINR(1250)}</strong></span>
            <span>Platform Amount: <strong>{formatINR(45600.5)}</strong></span>
            <span>Large Co-op Budget: <strong>{formatINR(15000000, { compact: true })}</strong></span>
          </div>
        </section>

        {/* Section 2: Buttons & Badges */}
        <section>
          <SectionHeader title="2. Buttons & Badges" description="Primary, secondary, outline, destructive, and status badges." />
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <Button variant="default">Primary Action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button isLoading>Loading</Button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Verified Success</Badge>
            <Badge variant="warning">Action Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="info">Platform Info</Badge>
          </div>
        </section>

        {/* Section 3: Form Controls */}
        <section>
          <SectionHeader title="3. Form Input Controls" description="Input, Textarea, Select, Checkbox, Radio, and Switch." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Input placeholder="Enter household address..." />
            <Select>
              <option>Select Service Category</option>
              <option>Electrical Repairs</option>
              <option>Plumbing Services</option>
              <option>Home Cleaning</option>
            </Select>
            <Textarea placeholder="Describe the service requirement in detail..." />
            <div className="space-y-3 p-4 border rounded-md">
              <Checkbox label="Agree to Cooperative By-laws" checked={checked} onCheckedChange={setChecked} />
              <div className="flex space-x-4">
                <RadioItem value="option1" label="Cash on Service" checked={radioVal === "option1"} onSelect={setRadioVal} />
                <RadioItem value="option2" label="Online Razorpay" checked={radioVal === "option2"} onSelect={setRadioVal} />
              </div>
              <Switch label="Receive Realtime SMS Updates" checked={switchVal} onCheckedChange={setSwitchVal} />
            </div>
          </div>
        </section>

        {/* Section 4: Data Display, Avatars & Dropdown */}
        <section>
          <SectionHeader title="4. Avatars, Tooltips, Tabs, Dropdowns & Cards" description="Interactive primitives for profiles and dropdown menus." />
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar fallback="Ramesh Kumar" size="lg" />
              <Avatar fallback="Priya Sharma" size="default" />
              <Tooltip content="Cooperative Certified Plumbing Specialist">
                <Badge variant="success">Hover for Tooltip</Badge>
              </Tooltip>
              <Dropdown
                trigger={<Button size="sm" variant="outline">Context Actions Menu</Button>}
                items={[
                  { label: "View Profile" },
                  { label: "Export Record" },
                ]}
              />
            </div>

            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Cooperative Card Component</CardTitle>
                <CardDescription>Structured card container with header, content, and footer.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Standardized card surface with clean border radius and HSL card background.</p>
              </CardContent>
              <CardFooter className="justify-end border-t pt-4">
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Tabs
              tabs={[
                { id: "t1", label: "Overview", content: <p className="text-xs text-muted-foreground">General platform statistics and service summaries.</p> },
                { id: "t2", label: "Verification", content: <p className="text-xs text-muted-foreground">Worker identity and skill background checks.</p> },
              ]}
            />
          </div>
        </section>

        {/* Section 5: Status Badges & Timelines */}
        <section>
          <SectionHeader title="5. Status Indicators & Timelines" description="Domain status pills and step progression timelines." />
          <div className="flex flex-wrap gap-2 mb-6">
            <StatusBadge status="pending" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="completed" />
            <StatusBadge status="cancelled" />
            <StatusBadge status="verified" />
            <StatusBadge status="paid" />
            <StatusBadge status="overdue" />
          </div>

          <Card className="p-6 max-w-md">
            <h4 className="font-semibold text-sm mb-4">Service Delivery Timeline</h4>
            <StatusTimeline
              steps={[
                { id: "1", title: "Booking Placed", description: "Customer created request #BK-102", isCompleted: true, timestamp: "09:00 AM" },
                { id: "2", title: "Worker Assigned", description: "Suresh (Electrician) accepted", isCompleted: true, timestamp: "09:15 AM" },
                { id: "3", title: "Service In Progress", description: "Worker arrived at site", isCompleted: false, isCurrent: true },
                { id: "4", title: "Payment & Completion", description: "Escrow release pending", isCompleted: false },
              ]}
            />
          </Card>
        </section>

        {/* Section 6: Feedback & Notification Components */}
        <section>
          <SectionHeader title="6. Feedback & Notification Components" description="Empty states, loading states, error boundaries, and notifications." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert variant="info">
              <AlertTitle>Cooperative Platform Notice</AlertTitle>
              <AlertDescription>All gig workers receive 100% fair pricing with transparent platform fees.</AlertDescription>
            </Alert>
            <ToastItem message={{ id: "demo", title: "Service Scheduled", description: "Worker confirmed for tomorrow 10:00 AM.", variant: "success" }} onDismiss={() => {}} />
            <NotificationItem id="n-demo" title="New Booking Match" message="Electrician assigned to your area." timestamp="5m ago" isRead={false} type="success" />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium">Worker Score:</span>
              <Rating value={4.8} />
            </div>
            <EmptyState title="No Active Bookings" description="You have no pending household service bookings right now." actionLabel="Book Service Now" onAction={() => {}} />
            <ErrorState title="Connection Error" message="Unable to fetch realtime worker locations." onRetry={() => {}} />
            <div className="col-span-1 md:col-span-2">
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">Skeleton Loading State:</h5>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-4">
                <LoadingState type="cards" count={2} />
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Shared Domain Cards */}
        <section>
          <SectionHeader title="7. Domain-Specific Component Cards" description="Reusable Worker, Booking, Payment, Invoice, and Map cards." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WorkerCard
              id="w1"
              name="Ramesh Kumar"
              skillName="Master Electrician"
              rating={4.8}
              completedJobs={142}
              hourlyRate={350}
              distanceKm={2.4}
              onSelect={() => {}}
            />

            <BookingCard
              bookingId="BK-8890"
              serviceTitle="Full Home Electrical Rewiring"
              customerName="Ananya Vaghela"
              workerName="Ramesh Kumar"
              scheduledDate="04 Sep 2026"
              scheduledTime="10:30 AM"
              locationAddress="Flat 402, Swastik Enclave, City Center"
              totalAmount={1850}
              status="in_progress"
              onViewDetails={() => {}}
            />

            <MapCard
              locationName="Customer Service Address"
              address="Sector 14, Community Center, Hub 3"
              distanceText="1.8 km away"
              onNavigate={() => {}}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <WorkerProfileCard
              name="Sunita Devi"
              cooperativeName="Seva Women's Service Cooperative"
              cooperativeId="COP-MH-442"
              skills={["Deep House Cleaning", "Sanitization", "Kitchen Maintenance"]}
              rating={4.9}
              experienceYears={6}
              hourlyRate={400}
              certifications={["ISO 9001 Hygiene Certified", "Cooperative Safety Trained"]}
            />

            <PaymentSummary
              basePrice={1500}
              platformFee={75}
              taxAmount={135}
              discountAmount={50}
              totalPayable={1660}
            />
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-semibold mb-3">Cooperative Invoice Component:</h4>
            <Invoice
              invoiceNumber="INV-2026-089"
              issueDate="02 Sep 2026"
              dueDate="05 Sep 2026"
              cooperativeName="Pune Household Services Worker Cooperative Society"
              cooperativeGst="27AAAAA0000A1Z5"
              customerName="Vikram Mehta"
              customerAddress="B-12 Lotus Towers, Baner, Pune"
              items={[
                { description: "AC Cleaning & Gas Refill", quantity: 1, unitPrice: 1200, amount: 1200 },
                { description: "Electrical Main Switch Repair", quantity: 1, unitPrice: 300, amount: 300 },
              ]}
              subtotal={1500}
              platformFee={75}
              taxAmount={135}
              totalAmount={1710}
              status="paid"
              onDownload={() => {}}
            />
          </div>
        </section>

        {/* Section 8: Table, Separator & Pagination */}
        <section>
          <SectionHeader title="8. Data Table, Separator & Pagination" description="Standard data table view with pagination controller." />
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Service Skill</TableHead>
                  <TableHead>Cooperative Status</TableHead>
                  <TableHead className="text-right">Hourly Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Ramesh Kumar</TableCell>
                  <TableCell>Electrician</TableCell>
                  <TableCell><StatusBadge status="verified" /></TableCell>
                  <TableCell className="text-right font-medium">{formatINR(350)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sunita Devi</TableCell>
                  <TableCell>House Cleaning</TableCell>
                  <TableCell><StatusBadge status="verified" /></TableCell>
                  <TableCell className="text-right font-medium">{formatINR(400)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Separator />

            <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
          </div>
        </section>

        {/* Modals */}
        <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Cooperative Action Modal">
          <p className="text-sm text-muted-foreground">This is a reusable modal dialog component formatted with accessibility and design tokens.</p>
        </Dialog>

        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Mobile Sheet Drawer">
          <p className="text-sm text-muted-foreground">This bottom drawer slide-over component is optimized for mobile-first customer and worker flows.</p>
        </Drawer>
      </div>
    </AppShell>
  );
}
