import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Loader2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Utility function to strip HTML tags and decode HTML entities
function stripHtmlAndDecode(html: string): string {
  if (!html) return "";
  
  // Create a temporary div element to decode HTML entities and strip tags
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  
  // Get text content (automatically strips HTML tags and decodes entities)
  let text = tempDiv.textContent || tempDiv.innerText || "";
  
  // Clean up extra whitespace and line breaks
  text = text
    .replace(/\n\s*\n/g, '\n\n') // Replace multiple line breaks with double line break
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .trim();
  
  return text;
}

interface DetailedWorkItem {
  id: string;
  title: string;
  type: string;
  state: string;
  assignedTo: string;
  createdBy: string;
  createdDate: string;
  changedDate: string;
  description: string;
  acceptanceCriteria: string;
  storyPoints: number | null;
  priority: number | null;
  severity: string | null;
  businessValue: number | null;
  timeCriticality: number | null;
  effort: number | null;
  remainingWork: number | null;
  originalEstimate: number | null;
  completedWork: number | null;
  reproSteps: string;
  tags: string;
  iterationPath: string;
  areaPath: string;
  url: string;
  relations: any[];
}

interface AdoWorkItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workItem: DetailedWorkItem | null;
  projectName: string;
  artifactOrgId?: string;
  organizationUrl?: string;
}

export function AdoWorkItemEditDialog({
  open,
  onOpenChange,
  workItem,
  projectName,
  artifactOrgId,
  organizationUrl,
}: AdoWorkItemEditDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    state: "",
    assignedTo: "",
    storyPoints: "",
    priority: "",
    severity: "",
    businessValue: "",
    timeCriticality: "",
    effort: "",
    remainingWork: "",
    originalEstimate: "",
    completedWork: "",
    acceptanceCriteria: "",
    reproSteps: "",
    tags: "",
  });

  useEffect(() => {
    if (workItem && open) {
      setFormData({
        title: workItem.title || "",
        description: stripHtmlAndDecode(workItem.description || ""),
        state: workItem.state || "",
        assignedTo: workItem.assignedTo || "",
        storyPoints: workItem.storyPoints?.toString() || "",
        priority: workItem.priority?.toString() || "",
        severity: workItem.severity || "",
        businessValue: workItem.businessValue?.toString() || "",
        timeCriticality: workItem.timeCriticality?.toString() || "",
        effort: workItem.effort?.toString() || "",
        remainingWork: workItem.remainingWork?.toString() || "",
        originalEstimate: workItem.originalEstimate?.toString() || "",
        completedWork: workItem.completedWork?.toString() || "",
        acceptanceCriteria: stripHtmlAndDecode(workItem.acceptanceCriteria || ""),
        reproSteps: stripHtmlAndDecode(workItem.reproSteps || ""),
        tags: workItem.tags || "",
      });
    }
  }, [workItem, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const params = new URLSearchParams();
      if (artifactOrgId) {
        params.append('artifactOrgId', artifactOrgId);
      } else if (organizationUrl) {
        params.append('organizationUrl', organizationUrl);
      }
      const url = `/api/hub/artifacts/${projectName}/work-item/${workItem?.id}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("PATCH", url, data);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/hub/artifacts/${projectName}/work-items`, artifactOrgId, organizationUrl] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/hub/artifacts/${projectName}/work-item/${workItem?.id}`] 
      });
      
      toast({
        title: "Success",
        description: "Work item updated successfully in Azure DevOps",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update work item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: any = {};

    if (formData.title) updateData.title = formData.title;
    if (formData.description !== undefined) updateData.description = formData.description;
    if (formData.state) updateData.state = formData.state;
    // Only send assignedTo if it's a valid value (not "Unassigned" or empty)
    // If it's "Unassigned" or empty, we skip it entirely (don't update the field)
    if (formData.assignedTo && formData.assignedTo.trim() !== "" && formData.assignedTo !== "Unassigned") {
      updateData.assignedTo = formData.assignedTo.trim();
    }
    // Note: If assignedTo is "Unassigned" or empty, we don't include it in updateData
    // This means the field won't be updated, which is the desired behavior
    
    // Handle numeric fields - allow 0 and empty strings
    if (formData.storyPoints !== "" && formData.storyPoints !== null) {
      updateData.storyPoints = parseFloat(formData.storyPoints);
    }
    if (formData.priority !== "" && formData.priority !== null) {
      updateData.priority = parseInt(formData.priority);
    }
    if (formData.severity) updateData.severity = formData.severity;
    if (formData.businessValue !== "" && formData.businessValue !== null) {
      updateData.businessValue = parseFloat(formData.businessValue);
    }
    if (formData.timeCriticality !== "" && formData.timeCriticality !== null) {
      updateData.timeCriticality = parseFloat(formData.timeCriticality);
    }
    if (formData.effort !== "" && formData.effort !== null) {
      updateData.effort = parseFloat(formData.effort);
    }
    
    // Time tracking fields - allow 0 and empty strings
    if (formData.remainingWork !== "" && formData.remainingWork !== null) {
      updateData.remainingWork = parseFloat(formData.remainingWork);
    }
    if (formData.originalEstimate !== "" && formData.originalEstimate !== null) {
      updateData.originalEstimate = parseFloat(formData.originalEstimate);
    }
    if (formData.completedWork !== "" && formData.completedWork !== null) {
      updateData.completedWork = parseFloat(formData.completedWork);
    }
    
    if (formData.acceptanceCriteria !== undefined) updateData.acceptanceCriteria = formData.acceptanceCriteria;
    if (formData.reproSteps !== undefined) updateData.reproSteps = formData.reproSteps;
    if (formData.tags !== undefined) updateData.tags = formData.tags;

    updateMutation.mutate(updateData);
  };

  if (!workItem) return null;

  const isTaskOrIssue = workItem.type === "Task" || workItem.type === "Issue";
  const isUserStory = workItem.type === "User Story";
  const isEpicOrFeature = workItem.type === "Epic" || workItem.type === "Feature";
  const isBug = workItem.type === "Bug";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit {workItem.type} - {workItem.id}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit} className="space-y-4 pr-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="resize-y min-h-[120px] break-words whitespace-pre-wrap"
                placeholder="Enter description..."
              />
            </div>

            {/* State and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., New, Active, Resolved, Closed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority (1=High, 2=Medium, 3=Low)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="4"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="1-4"
                />
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="User display name or email"
              />
            </div>

            {/* Time Tracking Fields - Most Important */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Tracking
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalEstimate">Original Estimate (hours)</Label>
                  <Input
                    id="originalEstimate"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.originalEstimate}
                    onChange={(e) => setFormData({ ...formData, originalEstimate: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remainingWork">Remaining Work (hours)</Label>
                  <Input
                    id="remainingWork"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.remainingWork}
                    onChange={(e) => setFormData({ ...formData, remainingWork: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completedWork">Completed Work (hours)</Label>
                  <Input
                    id="completedWork"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.completedWork}
                    onChange={(e) => setFormData({ ...formData, completedWork: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Type-specific fields */}
            {isUserStory && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="storyPoints">Story Points</Label>
                  <Input
                    id="storyPoints"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.storyPoints}
                    onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
                  <Textarea
                    id="acceptanceCriteria"
                    value={formData.acceptanceCriteria}
                    onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
                    rows={6}
                    className="resize-y min-h-[120px] break-words whitespace-pre-wrap"
                    placeholder="Enter acceptance criteria..."
                  />
                </div>
              </>
            )}

            {isEpicOrFeature && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessValue">Business Value</Label>
                  <Input
                    id="businessValue"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.businessValue}
                    onChange={(e) => setFormData({ ...formData, businessValue: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeCriticality">Time Criticality</Label>
                    <Input
                      id="timeCriticality"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.timeCriticality}
                      onChange={(e) => setFormData({ ...formData, timeCriticality: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="effort">Effort</Label>
                    <Input
                      id="effort"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.effort}
                      onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            )}

            {isBug && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Input
                    id="severity"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    placeholder="e.g., 1 - Critical, 2 - High, 3 - Medium, 4 - Low"
                  />
                </div>

                      <div className="space-y-2">
                        <Label htmlFor="reproSteps">Repro Steps</Label>
                        <Textarea
                          id="reproSteps"
                          value={formData.reproSteps}
                          onChange={(e) => setFormData({ ...formData, reproSteps: e.target.value })}
                          rows={6}
                          className="resize-y min-h-[120px] break-words whitespace-pre-wrap"
                          placeholder="Enter reproduction steps..."
                        />
                      </div>
              </>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (semicolon-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tag1; tag2; tag3"
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

