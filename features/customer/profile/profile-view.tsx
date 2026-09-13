"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Check,
  Star,
  Loader2,
} from "lucide-react";
import { AddressItem } from "@/features/customer/service-booking/types";
import { createClient } from "@/lib/supabase/client";

export interface CustomerAddress extends AddressItem {
  userId?: string;
  label: string;
}

export function ProfileView() {
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [addresses, setAddresses] = React.useState<CustomerAddress[]>([]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingAddr, setEditingAddr] = React.useState<CustomerAddress | null>(null);
  const [savingAddr, setSavingAddr] = React.useState(false);

  // Profile State
  const [userProfile, setUserProfile] = React.useState<{
    fullName: string;
    email: string;
    phone: string;
    preferredLanguage?: string;
  }>({
    fullName: "Customer",
    email: "customer@example.com",
    phone: "+91 98765 43210",
  });
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [editFullName, setEditFullName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Feedback Notification
  const [notification, setNotification] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Address Form State
  const [label, setLabel] = React.useState<string>("Home");
  const [addressLine1, setAddressLine1] = React.useState<string>("" );
  const [addressLine2, setAddressLine2] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("Ahmedabad");
  const [state, setState] = React.useState<string>("Gujarat");
  const [postalCode, setPostalCode] = React.useState<string>("380015");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        setUserId(user.id);

        // Fetch Profile from real Supabase DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("full_name, email, phone, role")
          .eq("id", user.id)
          .maybeSingle();

        const name = profile?.full_name || user.user_metadata?.full_name || "Customer";
        const email = profile?.email || user.email || "customer@example.com";
        const phone = profile?.phone || user.user_metadata?.phone || "+91 98765 43210";
        const lang = user.user_metadata?.preferred_language || "en";

        setUserProfile({
          fullName: name,
          email,
          phone,
          preferredLanguage: lang,
        });
        setEditFullName(name);
        setEditPhone(phone);

        // Fetch Addresses from real Supabase DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dbAddresses, error: addrError } = await (supabase.from("addresses") as any)
          .select("*")
          .eq("profile_id", user.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });

        if (!addrError && dbAddresses) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: CustomerAddress[] = dbAddresses.map((a: any) => ({
            id: a.id,
            userId: a.profile_id,
            label: a.title || "Home",
            title: a.title || "Home",
            addressLine1: a.address_line1,
            addressLine2: a.address_line2 || undefined,
            city: a.city,
            state: a.state,
            postalCode: a.postal_code,
            isDefault: a.is_default,
          }));
          setAddresses(mapped);
        }
      }
    } catch (err) {
      console.error("Error loading customer profile data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear notification after 4 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingProfile(true);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update profile");
      }

      setUserProfile((prev) => ({
        ...prev,
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
      }));
      setIsEditingProfile(false);
      setNotification({ type: "success", message: "Personal profile updated successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setNotification({ type: "error", message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1.trim() || !userId) return;
    setSavingAddr(true);

    const supabase = createClient();

    if (editingAddr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("addresses") as any)
        .update({
          title: label,
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
        })
        .eq("id", editingAddr.id)
        .eq("profile_id", userId);

      if (error) {
        setNotification({ type: "error", message: `Failed to update address: ${error.message}` });
      } else {
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === editingAddr.id
              ? {
                  ...a,
                  label,
                  title: label,
                  addressLine1: addressLine1.trim(),
                  addressLine2: addressLine2.trim() || undefined,
                  city: city.trim(),
                  state: state.trim(),
                  postalCode: postalCode.trim(),
                }
              : a
          )
        );
        setNotification({ type: "success", message: "Address updated successfully." });
        resetForm();
      }
    } else {
      const isFirst = addresses.length === 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newRow, error } = await (supabase.from("addresses") as any)
        .insert({
          profile_id: userId,
          title: label,
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
          is_default: isFirst,
        })
        .select()
        .single();

      if (error) {
        setNotification({ type: "error", message: `Failed to save address: ${error.message}` });
      } else if (newRow) {
        const newAddr: CustomerAddress = {
          id: newRow.id,
          userId: newRow.profile_id,
          label: newRow.title || label,
          title: newRow.title || label,
          addressLine1: newRow.address_line1,
          addressLine2: newRow.address_line2 || undefined,
          city: newRow.city,
          state: newRow.state,
          postalCode: newRow.postal_code,
          isDefault: newRow.is_default,
        };
        setAddresses((prev) => [...prev, newAddr]);
        setNotification({ type: "success", message: "New address saved to database." });
        resetForm();
      }
    }

    setSavingAddr(false);
  };

  const handleEdit = (addr: CustomerAddress) => {
    setEditingAddr(addr);
    setLabel(addr.label);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("addresses") as any)
      .delete()
      .eq("id", id)
      .eq("profile_id", userId);

    if (error) {
      setNotification({ type: "error", message: `Failed to delete address: ${error.message}` });
    } else {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setNotification({ type: "success", message: "Address deleted from database." });
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!userId) return;
    const supabase = createClient();

    // 1. Reset all addresses for this profile to is_default = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("addresses") as any)
      .update({ is_default: false })
      .eq("profile_id", userId);

    // 2. Set target address to is_default = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("addresses") as any)
      .update({ is_default: true })
      .eq("id", id)
      .eq("profile_id", userId);

    if (error) {
      setNotification({ type: "error", message: `Failed to set default address: ${error.message}` });
    } else {
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      setNotification({ type: "success", message: "Default delivery location updated." });
    }
  };

  const resetForm = () => {
    setEditingAddr(null);
    setLabel("Home");
    setAddressLine1("");
    setAddressLine2("");
    setCity("Ahmedabad");
    setState("Gujarat");
    setPostalCode("380015");
    setShowAddForm(false);
  };

  const initials = userProfile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Customer Profile & Settings"
        description="Manage verified personal information and saved household service delivery addresses."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Profile" },
        ]}
      />

      {/* Toast Notification Alert */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Account Info Overview */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
              {initials || "C"}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {userProfile.fullName}
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Member ID: {userId ? `CUST-${userId.slice(0, 8).toUpperCase()}` : "CUST-VERIFIED"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-bold text-xs px-3 py-1">
              VERIFIED HOUSEHOLD CUSTOMER
            </Badge>
            {!isEditingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="text-xs border-slate-300 hover:bg-slate-50 gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>Edit Personal Information</span>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingProfile}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 gap-1.5"
              >
                {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Mobile Number
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">{userProfile.phone}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Address
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{userProfile.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-emerald-600" /> Default Cooperative Hub
              </span>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">Gujarat Labour Cooperative Federation</p>
            </div>
          </div>
        )}
      </Card>

      {/* Saved Addresses Section */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
              Saved Service Locations ({addresses.length})
            </h4>
          </div>

          {!showAddForm && (
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          )}
        </div>

        {/* Add / Edit Form */}
        {showAddForm && (
          <form
            onSubmit={handleSaveAddress}
            className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>{editingAddr ? "Edit Address" : "Add New Address"}</span>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Label</label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Rental">Rental</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="380015"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Address Line 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Flat / House No / Building Name"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Street / Area / Landmark"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={resetForm} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingAddr}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 gap-1.5"
              >
                {savingAddr && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingAddr ? "Save Changes" : "Save Address"}
              </Button>
            </div>
          </form>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading saved addresses from database...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && addresses.length === 0 && !showAddForm && (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">No service locations saved yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Add your household or office address so cooperative workers can arrive accurately for service visits.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Your First Address
            </Button>
          </div>
        )}

        {/* Saved Addresses List */}
        {!loading && (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                  addr.isDefault
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm"
                    : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                      {addr.label}
                    </Badge>
                    {addr.isDefault ? (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Default Delivery Location
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[10px] text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium flex items-center gap-0.5 hover:underline"
                        title="Set as default delivery address"
                      >
                        <Star className="w-3 h-3 text-slate-400 hover:text-emerald-600" /> Make Default
                      </button>
                    )}
                  </div>

                  <p className="font-bold text-slate-900 dark:text-slate-100">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-slate-500 font-medium">{addr.addressLine2}</p>}
                  <p className="text-slate-500 font-mono text-[11px]">
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(addr)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
                    title="Edit Address"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
                    title="Remove Address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
