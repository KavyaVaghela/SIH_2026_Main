"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Clock, User, ShieldCheck } from "lucide-react";
import type { ComplaintNote } from "../types";

interface ComplaintNotesSectionProps {
  notes: ComplaintNote[];
  onAddNote: (noteText: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ComplaintNotesSection({
  notes,
  onAddNote,
  isSubmitting,
}: ComplaintNotesSectionProps) {
  const [newNoteText, setNewNoteText] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    await onAddNote(newNoteText.trim());
    setNewNoteText("");
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-foreground flex items-center space-x-2">
          <MessageSquarePlus className="h-4 w-4 text-emerald-700" />
          <span>Internal Administrative Audit Notes ({notes.length})</span>
        </CardTitle>
        <span className="text-[11px] text-muted-foreground">Confidential & Internal Only</span>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Form to Add New Note */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Add internal investigation note, call log with federation secretary, or technical assessment..."
            className="w-full h-20 text-xs p-3 rounded-lg border bg-background text-foreground resize-none focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !newNoteText.trim()}
              className="h-8 text-xs bg-emerald-800 text-white hover:bg-emerald-900 font-semibold"
            >
              Append Admin Note
            </Button>
          </div>
        </form>

        {/* Existing Notes Timeline */}
        {notes.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground italic border-t">
            No internal administrative notes recorded for this complaint yet.
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center space-x-1.5 font-semibold text-foreground">
                    <User className="h-3 w-3 text-emerald-700" />
                    <span>{note.authorName}</span>
                    <span className="text-muted-foreground font-normal">({note.authorRole})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{note.createdAt}</span>
                  </div>
                </div>

                <p className="text-foreground leading-relaxed pt-1">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
