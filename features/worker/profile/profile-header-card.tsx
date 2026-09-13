"use client";

import * as React from "react";
import { Award, Briefcase, Star, Edit3, PlusCircle, Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { WorkerProfileDetails } from "../types";

export interface ProfileHeaderCardProps {
  profile: WorkerProfileDetails;
  onEditProfile: () => void;
  onUpdateSkills: () => void;
  onUpdateAvatar?: (newUrl: string) => void;
}

export function ProfileHeaderCard({
  profile,
  onEditProfile,
  onUpdateSkills,
  onUpdateAvatar,
}: ProfileHeaderCardProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds 5MB limit. Please choose a smaller photo.");
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload profile photo.");
      }

      const newAvatarUrl = data.url;

      // Persist to public.profiles
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (supabase.from("profiles") as any)
          .update({
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateErr) {
          console.warn("Notice: Failed to sync avatar_url to profiles:", updateErr);
        }
      }

      onUpdateAvatar?.(newAvatarUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error uploading photo";
      console.error("Profile photo update error:", err);
      setUploadError(msg);
      alert(`Could not update photo: ${msg}`);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <div className="h-20 sm:h-24 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 w-full" />
      <CardContent className="p-5 sm:p-6 -mt-10 sm:-mt-12 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative group">
              <Avatar
                src={profile.avatarUrl || undefined}
                fallback={profile.name}
                size="xl"
                className="border-4 border-background shadow-md h-20 w-20 sm:h-24 sm:w-24 text-xl sm:text-2xl bg-emerald-700 text-white"
              />
              
              {/* Photo Upload Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelect}
                aria-label="Upload worker profile photo"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full border-2 border-background shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
                title="Change Profile Photo"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {profile.name}
                </h2>
                <Badge
                  variant={profile.verificationStatus === "verified" ? "success" : "secondary"}
                  className="text-xs font-semibold py-0.5 px-2"
                >
                  {profile.verificationStatus === "verified" ? "Verified Worker" : "Pending Verification"}
                </Badge>
                {profile.memberId && (
                  <span className="font-mono text-xs text-muted-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/50">
                    {profile.memberId}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center">
                <Briefcase className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                {profile.trade}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
                <span className="flex items-center font-medium text-foreground">
                  <Star className="h-3.5 w-3.5 mr-1 text-amber-500 fill-amber-500" />
                  {profile.rating.toFixed(1)} Rating
                </span>
                <span>•</span>
                <span>{profile.experienceYears} Years Experience</span>
                <span>•</span>
                <span>{profile.reviewsCount} Reviews</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className="text-xs font-medium border-border hover:bg-accent"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
            <Button
              size="sm"
              onClick={onUpdateSkills}
              className="text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Update Skills
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
