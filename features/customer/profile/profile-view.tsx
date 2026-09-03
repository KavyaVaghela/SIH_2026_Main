"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Building,
  Home as HomeIcon,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { AddressItem } from "@/features/customer/service-booking/types";

export interface CustomerAddress extends AddressItem {
  userId?: string;
  label: string;
}

const LOCAL_STORAGE_ADDRESSES_KEY = "kaushalyasetu_customer_addresses_db";

const DEFAULT_ADDRESSES: CustomerAddress[] = [
  {
    id: "addr-home-1",
    userId: "cust-1",
    label: "Home",
    title: "Home",
    addressLine1: "Flat 402, Shivam Apartments",
    addressLine2: "Near ISRO Colony, Satellite",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "380015",
    isDefault: true,
  },
  {
    id: "addr-office-1",
    userId: "cust-1",
    label: "Office",
    title: "Office",
    addressLine1: "Suite 804, Pinnacle Business Park",
    addressLine2: "SG Highway, Prahlad Nagar",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "380051",
    isDefault: false,
  },
];

export function ProfileView() {
  const [addresses, setAddresses] = React.useState<CustomerAddress[]>([]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingAddr, setEditingAddr] = React.useState<CustomerAddress | null>(null);

  // Form State
  const [label, setLabel] = React.useState<string>("Home");
  const [addressLine1, setAddressLine1] = React.useState<string>("");
  const [addressLine2, setAddressLine2] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("Ahmedabad");
  const [state, setState] = React.useState<string>("Gujarat");
  const [postalCode, setPostalCode] = React.useState<string>("380015");

  const loadAddresses = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ADDRESSES_KEY);
      if (stored) {
        setAddresses(JSON.parse(stored));
      } else {
        setAddresses(DEFAULT_ADDRESSES);
        localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(DEFAULT_ADDRESSES));
      }
    } catch {
      setAddresses(DEFAULT_ADDRESSES);
    }
  }, []);

  React.useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const saveAddressesToStorage = (updated: CustomerAddress[]) => {
    setAddresses(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(updated));
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1.trim()) return;

    if (editingAddr) {
      const updated = addresses.map((a) =>
        a.id === editingAddr.id
          ? { ...a, label, title: label, addressLine1, addressLine2, city, state, postalCode }
          : a
      );
      saveAddressesToStorage(updated);
    } else {
      const newAddr: CustomerAddress = {
        id: `addr-${Date.now()}`,
        userId: "cust-1",
        label,
        title: label,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        isDefault: addresses.length === 0,
      };
      saveAddressesToStorage([...addresses, newAddr]);
    }

    resetForm();
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

  const handleDelete = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    saveAddressesToStorage(updated);
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

      {/* Account Info Overview */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
              RP
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Ravi Patel
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </h3>
              <p className="text-xs text-slate-500 font-mono">Member ID: CUST-8092-AHM</p>
            </div>
          </div>

          <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-bold text-xs px-3 py-1">
            VERIFIED HOUSEHOLD CUSTOMER
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> Mobile Number
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">+91 98250 11021</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Address
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100">ravi.patel@example.com</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-emerald-600" /> Default Cooperative Hub
            </span>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">Satellite Artisans Cooperative Society</p>
          </div>
        </div>
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
          <form onSubmit={handleSaveAddress} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>{editingAddr ? "Edit Address" : "Add New Address"}</span>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Label</label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="380015"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Address Line 1</label>
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
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Street / Area / Landmark"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={resetForm} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-700 text-white font-bold text-xs px-4">
                Save Address
              </Button>
            </div>
          </form>
        )}

        {/* Saved Addresses List */}
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                    {addr.label}
                  </Badge>
                  {addr.isDefault && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Default Delivery Location
                    </span>
                  )}
                </div>

                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {addr.addressLine1}
                </p>
                {addr.addressLine2 && (
                  <p className="text-slate-500 font-medium">{addr.addressLine2}</p>
                )}
                <p className="text-slate-500 font-mono text-[11px]">
                  {addr.city}, {addr.state} - {addr.postalCode}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEdit(addr)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-200/50"
                  title="Edit Address"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/50"
                  title="Remove Address"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
