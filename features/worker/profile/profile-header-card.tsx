"use client";

import * as React from "react";
import { Award, Briefcase, Star, Edit3, PlusCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkerProfileDetails } from "../types";

export interface ProfileHeaderCardProps {
  profile: WorkerProfileDetails;
  onEditProfile: () => void;
  onUpdateSkills: () => void;
}

export function ProfileHeaderCard({
  profile,
  onEditProfile,
  onUpdateSkills,
}: ProfileHeaderCardProps) {
  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <div className="h-20 sm:h-24 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 w-full" />
      <CardContent className="p-5 sm:p-6 -mt-10 sm:-mt-12 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Avatar
                fallback={profile.name}
                size="xl"
                className="border-4 border-background shadow-md h-20 w-20 sm:h-24 sm:w-24 text-xl sm:text-2xl bg-emerald-700 text-white"
              />
              <div className="absolute bottom-1 right-1 p-1 bg-emerald-600 rounded-full border-2 border-background text-white">
                <Award className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {profile.name}
                </h2>
                <Badge variant="success" className="text-xs font-semibold py-0.5 px-2">
                  Verified Worker
                </Badge>
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
