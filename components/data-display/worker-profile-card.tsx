import * as React from "react";
import { ShieldCheck, Award, Briefcase, Building2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Rating } from "./rating";
import { formatINR } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export interface WorkerProfileCardProps {
  name: string;
  avatarUrl?: string;
  cooperativeName: string;
  cooperativeId: string;
  skills: string[];
  rating: number;
  experienceYears: number;
  hourlyRate: number;
  certifications?: string[];
  isVerified?: boolean;
  className?: string;
}

export function WorkerProfileCard({
  name,
  avatarUrl,
  cooperativeName,
  cooperativeId,
  skills,
  rating,
  experienceYears,
  hourlyRate,
  certifications = [],
  isVerified = true,
  className,
}: WorkerProfileCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/30 border-b p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
          <Avatar src={avatarUrl} fallback={name} size="xl" />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold text-foreground">{name}</h3>
              {isVerified && (
                <Badge variant="success" className="text-xs">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Verified Member
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start">
              <Building2 className="mr-1 h-3.5 w-3.5 text-primary" />
              {cooperativeName} (ID: {cooperativeId})
            </p>

            <Rating value={rating} size="default" />
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{formatINR(hourlyRate)}</span>
            <span className="text-xs text-muted-foreground block">per hour</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center">
            <Briefcase className="mr-1.5 h-4 w-4" />
            Skills & Services ({experienceYears} Yrs Experience)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, i) => (
              <Badge key={i} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {certifications.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center">
              <Award className="mr-1.5 h-4 w-4" />
              Cooperative Certifications
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {certifications.map((cert, i) => (
                <Badge key={i} variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
