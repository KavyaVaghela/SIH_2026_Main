"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef } from "react";

import { subscribeToPostgresChanges, type RealtimeSubscriptionOptions } from "@/lib/supabase/realtime";

export interface UseRealtimeSubscriptionProps {
  table: string;
  schema?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  enabled?: boolean;
  onPayload: (payload: any) => void;
}

export type RealtimeConnectionStatus = "IDLE" | "CONNECTING" | "SUBSCRIBED" | "CLOSED" | "CHANNEL_ERROR" | "TIMED_OUT";

export function useRealtimeSubscription({
  table,
  schema = "public",
  event = "*",
  filter,
  enabled = true,
  onPayload,
}: UseRealtimeSubscriptionProps) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("IDLE");
  const [error, setError] = useState<Error | null>(null);

  // Keep latest payload callback in ref to prevent unnecessary re-subscriptions
  const onPayloadRef = useRef(onPayload);
  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    if (!enabled || !table) {
      setStatus("IDLE");
      return;
    }

    setStatus("CONNECTING");
    setError(null);

    const { channel, unsubscribe } = subscribeToPostgresChanges({
      table,
      schema,
      event,
      filter,
      onPayload: (payload) => {
        onPayloadRef.current(payload);
      },
      onStatus: (sysStatus, err) => {
        if (sysStatus === "SUBSCRIBED") {
          setStatus("SUBSCRIBED");
          setError(null);
        } else if (sysStatus === "CLOSED") {
          setStatus("CLOSED");
        } else if (sysStatus === "CHANNEL_ERROR") {
          setStatus("CHANNEL_ERROR");
          setError(err || new Error(`Channel error on table ${table}`));
        } else if (sysStatus === "TIMED_OUT") {
          setStatus("TIMED_OUT");
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [table, schema, event, filter, enabled]);

  return { status, error, isConnected: status === "SUBSCRIBED" };
}
