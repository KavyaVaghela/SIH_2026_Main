"use client";

import * as React from "react";
import { ChevronRight, ArrowLeft, MapPin, Plus, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddressItem } from "../types";
import { createClient } from "@/lib/supabase/client";

export interface StepAddressProps {
  selectedAddress: AddressItem | null;
  onSelectAddress: (address: AddressItem) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Deduplicate identical addresses before rendering selection list.
 * Normalizes address fields to identify identical locations
 * while preserving stable IDs and user selection.
 */
function deduplicateAddresses(list: AddressItem[], selectedId?: string | null): AddressItem[] {
  const seen = new Map<string, AddressItem>();

  for (const addr of list) {
    const normLine1 = (addr.addressLine1 || "").trim().toLowerCase();
    const normLine2 = (addr.addressLine2 || "").trim().toLowerCase();
    const normCity = (addr.city || "").trim().toLowerCase();
    const normState = (addr.state || "").trim().toLowerCase();
    const normPostal = (addr.postalCode || "").trim().toLowerCase();
    const key = `${normLine1}|${normLine2}|${normCity}|${normState}|${normPostal}`;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, addr);
    } else {
      // If the duplicate matches selectedId, retain it so selection ID remains identical
      if (selectedId && addr.id === selectedId) {
        seen.set(key, addr);
      } else if (addr.isDefault && !existing.isDefault && existing.id !== selectedId) {
        // If duplicate is default and existing is not (and not selected), prefer default
        seen.set(key, addr);
      }
    }
  }

  return Array.from(seen.values());
}

export function StepAddress({
  selectedAddress,
  onSelectAddress,
  onNext,
  onBack,
}: StepAddressProps) {
  const [addresses, setAddresses] = React.useState<AddressItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Deduplicate identical addresses for display
  const displayedAddresses = React.useMemo(() => {
    return deduplicateAddresses(addresses, selectedAddress?.id);
  }, [addresses, selectedAddress?.id]);

  // New address form state
  const [title, setTitle] = React.useState("Home");
  const [line1, setLine1] = React.useState("");
  const [line2, setLine2] = React.useState("");
  const [city, setCity] = React.useState("Ahmedabad");
  const [stateName, setStateName] = React.useState("Gujarat");
  const [postalCode, setPostalCode] = React.useState("380015");

  // Load real saved addresses from database on mount
  React.useEffect(() => {
    let isMounted = true;

    async function loadAddresses() {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error: fetchErr } = await (supabase.from("addresses") as any)
            .select("*")
            .eq("profile_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: true });

          if (!fetchErr && data && isMounted) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapped: AddressItem[] = data.map((row: any) => ({
              id: row.id,
              title: row.title || "Home",
              addressLine1: row.address_line1,
              addressLine2: row.address_line2 || undefined,
              city: row.city,
              state: row.state,
              postalCode: row.postal_code,
              isDefault: row.is_default,
            }));
            setAddresses(mapped);

            if (!selectedAddress && mapped.length > 0) {
              const uniqueList = deduplicateAddresses(mapped);
              const defaultAddr = uniqueList.find((a) => a.isDefault) || uniqueList[0];
              if (defaultAddr) {
                onSelectAddress(defaultAddr);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load customer addresses for booking:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [selectedAddress, onSelectAddress]);

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1.trim()) {
      setError("Address Line 1 is required.");
      return;
    }
    if (!city.trim() || !stateName.trim() || !postalCode.trim()) {
      setError("City, State, and Postal Code are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let createdId = "";
      const isFirst = addresses.length === 0;

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inserted, error: insertErr } = await (supabase.from("addresses") as any)
          .insert({
            profile_id: user.id,
            title,
            address_line1: line1.trim(),
            address_line2: line2.trim() || null,
            city: city.trim(),
            state: stateName.trim(),
            postal_code: postalCode.trim(),
            is_default: isFirst,
          })
          .select()
          .single();

        if (insertErr) {
          console.warn("Could not insert address into database:", insertErr);
        } else if (inserted) {
          createdId = inserted.id;
        }
      }

      // If offline/unauthenticated or DB insert didn't return id, generate valid UUID fallback
      if (!createdId) {
        createdId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `addr-${Date.now()}`;
      }

      const newAddr: AddressItem = {
        id: createdId,
        title,
        addressLine1: line1.trim(),
        addressLine2: line2.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        isDefault: isFirst,
      };

      setAddresses((prev) => [...prev, newAddr]);
      onSelectAddress(newAddr);
      setShowAddForm(false);
      setError(null);

      // Reset form fields
      setLine1("");
      setLine2("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save address.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (!selectedAddress) {
      setError("Please select or add a service address.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Step 5: Select Service Address
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose where the cooperative worker should arrive to perform the service
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 gap-1.5 font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? "Cancel Add" : "Add New Address"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3 rounded-xl border border-rose-200 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Add New Address Form Modal/Card */}
      {showAddForm && (
        <Card className="p-5 bg-emerald-50/40 dark:bg-slate-900 border border-emerald-300/80 dark:border-emerald-800 shadow-sm rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Add New Service Address
          </h3>

          <form onSubmit={handleAddNewAddress} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Home", "Office", "Rental", "Other"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTitle(t)}
                  className={`py-1.5 px-3 rounded-lg border text-center font-medium transition-colors ${
                    title === t
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Address Line 1 <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="House/Flat No., Building Name, Street"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className="text-xs bg-white dark:bg-slate-950"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Address Line 2 (Locality / Landmark)
              </label>
              <Input
                placeholder="Near Landmark, Area / Colony"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className="text-xs bg-white dark:bg-slate-950"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">City</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">State</label>
                <Input
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Pincode</label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save & Select Address
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="py-8 text-center space-y-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your saved delivery locations...</p>
        </div>
      )}

      {/* Empty State when user has no saved addresses */}
      {!loading && displayedAddresses.length === 0 && !showAddForm && (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No saved addresses found</p>
            <p className="text-xs text-slate-500 mt-1">
              Please provide the service delivery location to proceed with booking.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Service Address
          </Button>
        </div>
      )}

      {/* Existing Addresses Grid */}
      {!loading && displayedAddresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedAddresses.map((addr) => {
            const isSelected = selectedAddress?.id === addr.id;

            return (
              <Card
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className={`p-4 cursor-pointer transition-all border rounded-xl flex flex-col justify-between ${
                  isSelected
                    ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-sm"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        {addr.title}
                      </Badge>
                      {addr.isDefault && (
                        <span className="text-[10px] text-slate-400 font-medium">(Default)</span>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{addr.addressLine1}</p>
                    {addr.addressLine2 && <p className="text-slate-500">{addr.addressLine2}</p>}
                    <p className="text-slate-500">{addr.city}, {addr.state} - {addr.postalCode}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs border-slate-300">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        <Button
          disabled={!selectedAddress}
          onClick={handleContinue}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 gap-1.5"
        >
          Select Preferred Date & Time
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
