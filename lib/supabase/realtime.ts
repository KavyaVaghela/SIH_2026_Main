/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";


export interface RealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  channelName?: string;
  onPayload: (payload: any) => void;
  onStatus?: (status: string, error?: Error | null) => void;
}

/**
 * Creates and subscribes to a Supabase Realtime channel for Postgres changes.
 * Returns the active RealtimeChannel instance and an unsubscribe function.
 */
export function subscribeToPostgresChanges(options: RealtimeSubscriptionOptions): {
  channel: RealtimeChannel;
  unsubscribe: () => void;
} {
  const supabase = createClient();
  const schema = options.schema || "public";
  const event = options.event || "*";
  const channelId =
    options.channelName ||
    `realtime-${options.table}-${options.filter || "all"}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const channel = supabase.channel(channelId);

  channel
    .on(
      "postgres_changes" as any,
      {
        event,
        schema,
        table: options.table,
        filter: options.filter,
      },
      (payload) => {
        try {
          options.onPayload(payload);
        } catch (err) {
          console.error(`[Realtime Error] Handling payload for ${options.table}:`, err);
        }
      }
    )
    .subscribe((status, err) => {
      if (options.onStatus) {
        options.onStatus(status, err);
      }
    });

  const unsubscribe = () => {
    try {
      supabase.removeChannel(channel);
    } catch (err) {
      console.warn(`[Realtime Cleanup Notice] ${channelId}:`, err);
    }
  };

  return { channel, unsubscribe };
}

/**
 * Helper to subscribe to booking changes for a customer or worker.
 */
export function subscribeToBookingEvents(
  filterColumn: "customer_id" | "worker_id" | "id",
  filterValue: string,
  onBookingChange: (payload: any) => void,
  onStatusChange?: (status: string) => void
) {
  return subscribeToPostgresChanges({
    table: "bookings",
    event: "*",
    filter: `${filterColumn}=eq.${filterValue}`,
    onPayload: onBookingChange,
    onStatus: (status) => onStatusChange?.(status),
  });
}

/**
 * Helper to subscribe to notifications for a profile.
 */
export function subscribeToNotificationEvents(
  profileId: string,
  onNotificationChange: (payload: any) => void,
  onStatusChange?: (status: string) => void
) {
  return subscribeToPostgresChanges({
    table: "notifications",
    event: "*",
    filter: `profile_id=eq.${profileId}`,
    onPayload: onNotificationChange,
    onStatus: (status) => onStatusChange?.(status),
  });
}

/**
 * Helper to subscribe to invoice changes for a customer or booking.
 */
export function subscribeToInvoiceEvents(
  filterColumn: "customer_id" | "booking_id",
  filterValue: string,
  onInvoiceChange: (payload: any) => void
) {
  return subscribeToPostgresChanges({
    table: "invoices",
    event: "*",
    filter: `${filterColumn}=eq.${filterValue}`,
    onPayload: onInvoiceChange,
  });
}

/**
 * Helper to subscribe to payment changes for a customer or booking.
 */
export function subscribeToPaymentEvents(
  filterColumn: "customer_id" | "booking_id",
  filterValue: string,
  onPaymentChange: (payload: any) => void
) {
  return subscribeToPostgresChanges({
    table: "payments",
    event: "*",
    filter: `${filterColumn}=eq.${filterValue}`,
    onPayload: onPaymentChange,
  });
}
