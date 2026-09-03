"use client";

import * as React from "react";
import { ChevronRight, ArrowLeft, MapPin, Plus, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddressItem } from "../types";

const MOCK_EXISTING_ADDRESSES: AddressItem[] = [
  {
    id: "addr-1",
    title: "Home",
    addressLine1: "Flat 402, Shivam Apartments",
    addressLine2: "Opp. Satellite Garden, Satellite",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "380015",
    isDefault: true,
  },
  {
    id: "addr-2",
    title: "Office",
    addressLine1: "Suite 601, Commerce House",
    addressLine2: "Near High Court, Navrangpura",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "380009",
    isDefault: false,
  },
];

export interface StepAddressProps {
  selectedAddress: AddressItem | null;
  onSelectAddress: (address: AddressItem) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAddress({
  selectedAddress,
  onSelectAddress,
  onNext,
  onBack,
}: StepAddressProps) {
  const [addresses, setAddresses] = React.useState<AddressItem[]>(MOCK_EXISTING_ADDRESSES);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // New address form state
  const [title, setTitle] = React.useState("Home");
  const [line1, setLine1] = React.useState("");
  const [line2, setLine2] = React.useState("");
  const [city, setCity] = React.useState("Ahmedabad");
  const [stateName, setStateName] = React.useState("Gujarat");
  const [postalCode, setPostalCode] = React.useState("380015");

  // Select default on mount if none selected
  React.useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      onSelectAddress(addresses[0]);
    }
  }, [selectedAddress, addresses, onSelectAddress]);

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1.trim()) {
      setError("Address Line 1 is required.");
      return;
    }
    if (!city.trim() || !stateName.trim() || !postalCode.trim()) {
      setError("City, State, and Postal Code are required.");
      return;
    }

    const newAddr: AddressItem = {
      id: `addr-${Date.now()}`,
      title,
      addressLine1: line1.trim(),
      addressLine2: line2.trim(),
      city: city.trim(),
      state: stateName.trim(),
      postalCode: postalCode.trim(),
      isDefault: false,
    };

    setAddresses((prev) => [...prev, newAddr]);
    onSelectAddress(newAddr);
    setShowAddForm(false);
    setError(null);

    // Reset form
    setLine1("");
    setLine2("");
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
        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3 rounded-xl border border-rose-200 text-xs font-medium">
          {error}
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
              <Button type="submit" size="sm" className="bg-emerald-700 text-white text-xs font-semibold">
                Save & Select Address
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Existing Addresses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
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
