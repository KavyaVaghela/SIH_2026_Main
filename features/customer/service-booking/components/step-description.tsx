"use client";

import * as React from "react";
import { ChevronRight, ArrowLeft, Image as ImageIcon, X, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface StepDescriptionProps {
  description: string;
  photoUrl?: string | null;
  onChangeDescription: (val: string) => void;
  onChangePhoto: (file: File | null, previewUrl: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDescription({
  description,
  photoUrl,
  onChangeDescription,
  onChangePhoto,
  onNext,
  onBack,
}: StepDescriptionProps) {
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChangeDescription(val);
    if (val.trim().length >= 10) {
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      onChangePhoto(file, preview);
    }
  };

  const handleRemovePhoto = () => {
    onChangePhoto(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinue = () => {
    if (!description || description.trim().length < 10) {
      setError("Please describe your requirement in at least 10 characters so the worker can prepare.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Step 3: Describe the Problem & Requirement
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Provide specific details about the repair or service you need
        </p>
      </div>

      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl space-y-4">
        {/* Description Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Problem / Requirement Description <span className="text-rose-500">*</span>
          </label>
          <Textarea
            rows={4}
            value={description}
            onChange={handleTextChange}
            placeholder="Tell us what is wrong or what work you need (e.g. Master bathroom tap leaking continuously, need to replace internal washer or tap unit)..."
            className="w-full text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 rounded-xl"
          />
          {error && (
            <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>
          )}
          <p className="text-[11px] text-slate-400">
            Minimum 10 characters required. The more details you provide, the faster matching occurs.
          </p>
        </div>

        {/* Optional Photo Upload */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Upload Photo of Issue <span className="text-slate-400 font-normal">(Optional)</span></span>
            <span className="text-[11px] text-emerald-600 font-medium">Helps worker bring exact spare parts</span>
          </label>

          {photoUrl ? (
            <div className="relative w-full max-w-xs h-40 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
              {/* eslint-disable-next-html-element-content-type */}
              {/* eslint-disable-next-html-element-attribute */}
              <img
                src={photoUrl}
                alt="Issue preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full text-xs shadow-md transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-950/60 rounded-xl p-5 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click to attach photo or tap to take picture
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG or WEBP up to 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs border-slate-300">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 gap-1.5"
        >
          View Platform Estimate
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
