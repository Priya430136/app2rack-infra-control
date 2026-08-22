"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createIncident } from "@/lib/incidents.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { serversQO } from "@/lib/infra-queries";

interface ReportIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function ReportIncidentDialog({ open, onOpenChange, onCreated }: ReportIncidentDialogProps) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [serverId, setServerId] = useState("");
  const [downtimeMin, setDowntimeMin] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const doCreate = useServerFn(createIncident);
  const servers = useQuery(serversQO);

  const reset = () => {
    setTitle("");
    setSeverity("Medium");
    setServerId("");
    setDowntimeMin(0);
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !serverId) {
      toast.error("Title and Server are required");
      return;
    }

    setSubmitting(true);
    try {
      await doCreate({
        data: {
          title: title.trim(),
          severity,
          serverId,
          downtimeMin,
          notes: notes.trim(),
        },
      });
      toast.success("Incident reported successfully");
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to report incident");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
          <DialogDescription>Log a new infrastructure incident to the system.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. High CPU on srv-node-7"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="downtime">Downtime (min)</Label>
              <Input
                id="downtime"
                type="number"
                min={0}
                value={downtimeMin}
                onChange={(e) => setDowntimeMin(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Server</Label>
            <Select value={serverId} onValueChange={setServerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a server" />
              </SelectTrigger>
              <SelectContent>
                {(servers.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Describe the issue..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Report Incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
