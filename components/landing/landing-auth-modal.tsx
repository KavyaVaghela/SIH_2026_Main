"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { X, Lock, ArrowRight, UserPlus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface AuthModalContextType {
  isOpen: boolean;
  openAuthModal: (contextMessage?: string) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  isOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const useAuthModal = () => useContext(AuthModalContext);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);

  const openAuthModal = (msg?: string) => {
    setContextMessage(msg || null);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
    setContextMessage(null);
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuthModal();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AuthModalContext.Provider value={{ isOpen, openAuthModal, closeAuthModal }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={closeAuthModal}
        >
          <div
            className="relative w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-2xl border border-[#8ed5a5] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-2 text-[#6b7280] hover:text-[#111827] rounded-full hover:bg-[#eaf5ee] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lock Icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-[#eaf5ee] text-[#135e38] flex items-center justify-center mb-4 border border-[#8ed5a5]/50">
              <Lock className="w-6 h-6" />
            </div>

            {/* Title */}
            <h3 id="auth-modal-title" className="text-xl font-extrabold text-[#111827] tracking-tight">
              {t("landing.authModal.title", "Sign in to continue")}
            </h3>

            {/* Description */}
            <p className="mt-2 text-sm text-[#374151] leading-relaxed">
              {t("landing.authModal.description", "Please sign in or create an account to access the KaushalyaSetu network.")}
            </p>

            {contextMessage && (
              <div className="mt-3.5 p-2.5 rounded-lg bg-[#f4fbf6] border border-[#8ed5a5]/40 text-xs font-semibold text-[#004525] leading-snug">
                {contextMessage}
              </div>
            )}

            {/* Action Buttons: Sign In and Register */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                onClick={closeAuthModal}
                className="flex-1 py-3 px-4 rounded-xl bg-[#135e38] text-white font-bold text-sm hover:bg-[#0c4427] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>{t("landing.authModal.signIn", "Sign In")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                onClick={closeAuthModal}
                className="flex-1 py-3 px-4 rounded-xl bg-[#eaf5ee] text-[#004525] font-bold text-sm border border-[#8ed5a5] hover:bg-[#8ed5a5] transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-[#135e38]" />
                <span>{t("landing.authModal.register", "Register")}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
