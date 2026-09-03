"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StepIndicator } from "./components/step-indicator";
import { StepCategory } from "./components/step-category";
import { StepSpecificWork } from "./components/step-specific-work";
import { StepDescription } from "./components/step-description";
import { StepEstimate } from "./components/step-estimate";
import { StepAddress } from "./components/step-address";
import { StepSchedule } from "./components/step-schedule";
import { StepReview } from "./components/step-review";
import { ServiceBookingDraft, BookingFlowStep, AddressItem, saveBookingDraft } from "./types";
import { ServiceCategory, ServiceItem, serviceCatalogService } from "@/features/services/services/service-catalog-service";
import { PlatformEstimateResult } from "@/features/pricing/services/pricing-service";

function BookingFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");

  const [currentStep, setCurrentStep] = React.useState<BookingFlowStep>(1);

  const [draft, setDraft] = React.useState<ServiceBookingDraft>({
    category: null,
    service: null,
    description: "",
    photoUrl: null,
    photoFile: null,
    estimate: null,
    address: null,
    preferredDate: new Date().toISOString().split("T")[0],
    preferredTimeSlot: "09:00 AM - 12:00 PM",
  });

  // Pre-load category if URL query parameter is present
  React.useEffect(() => {
    if (initialCategoryParam && !draft.category) {
      serviceCatalogService.getCategories().then((cats) => {
        const found = cats.find(
          (c) => c.id === initialCategoryParam || c.id.toLowerCase().includes(initialCategoryParam.toLowerCase())
        );
        if (found) {
          setDraft((prev) => ({ ...prev, category: found }));
          setCurrentStep(2);
        }
      });
    }
  }, [initialCategoryParam, draft.category]);

  const handleSelectCategory = (cat: ServiceCategory) => {
    setDraft((prev) => {
      if (prev.category?.id !== cat.id) {
        return { ...prev, category: cat, service: null, estimate: null };
      }
      return { ...prev, category: cat };
    });
  };

  const handleSelectService = (srv: ServiceItem) => {
    setDraft((prev) => ({ ...prev, service: srv }));
  };

  const handleChangeDescription = (desc: string) => {
    setDraft((prev) => ({ ...prev, description: desc }));
  };

  const handleChangePhoto = (file: File | null, previewUrl: string | null) => {
    setDraft((prev) => ({ ...prev, photoFile: file, photoUrl: previewUrl }));
  };

  const handleUpdateEstimate = React.useCallback((est: PlatformEstimateResult) => {
    setDraft((prev) => ({ ...prev, estimate: est }));
  }, []);

  const handleSelectAddress = React.useCallback((addr: AddressItem) => {
    setDraft((prev) => ({ ...prev, address: addr }));
  }, []);

  const handleChangeDate = (dateStr: string) => {
    setDraft((prev) => ({ ...prev, preferredDate: dateStr }));
  };

  const handleChangeTimeSlot = (slotStr: string) => {
    setDraft((prev) => ({ ...prev, preferredTimeSlot: slotStr }));
  };

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(7, prev + 1) as BookingFlowStep);
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as BookingFlowStep);
  };

  const handleJumpToStep = (step: BookingFlowStep) => {
    setCurrentStep(step);
  };

  const handleProceedToMatching = () => {
    saveBookingDraft(draft);
    router.push("/customer/find-worker");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Book a Household Service"
        description="Configure your service requirement, view platform estimates, and request verified cooperative workers."
        breadcrumbs={[
          { label: "Customer Portal", href: "/customer" },
          { label: "Service Booking Flow" },
        ]}
      />

      <StepIndicator currentStep={currentStep} onStepClick={handleJumpToStep} />

      <div className="mt-4">
        {currentStep === 1 && (
          <StepCategory
            selectedCategory={draft.category}
            onSelectCategory={handleSelectCategory}
            onNext={goToNextStep}
          />
        )}

        {currentStep === 2 && (
          <StepSpecificWork
            category={draft.category}
            selectedService={draft.service}
            onSelectService={handleSelectService}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 3 && (
          <StepDescription
            description={draft.description}
            photoUrl={draft.photoUrl}
            onChangeDescription={handleChangeDescription}
            onChangePhoto={handleChangePhoto}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 4 && (
          <StepEstimate
            service={draft.service}
            estimate={draft.estimate}
            onUpdateEstimate={handleUpdateEstimate}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 5 && (
          <StepAddress
            selectedAddress={draft.address}
            onSelectAddress={handleSelectAddress}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 6 && (
          <StepSchedule
            preferredDate={draft.preferredDate}
            preferredTimeSlot={draft.preferredTimeSlot}
            onChangeDate={handleChangeDate}
            onChangeTimeSlot={handleChangeTimeSlot}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 7 && (
          <StepReview
            draft={draft}
            onEditStep={handleJumpToStep}
            onProceedToMatching={handleProceedToMatching}
            onBack={goToPrevStep}
          />
        )}
      </div>
    </div>
  );
}

export function BookingFlowView() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 animate-pulse">Loading service booking wizard...</p>
        </div>
      }
    >
      <BookingFlowContent />
    </React.Suspense>
  );
}
