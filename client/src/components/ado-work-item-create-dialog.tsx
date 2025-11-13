import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdoWorkItemCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  artifactOrgId?: string;
  organizationUrl?: string;
}

export function AdoWorkItemCreateDialog({
  open,
  onOpenChange,
  projectName,
  artifactOrgId,
  organizationUrl,
}: AdoWorkItemCreateDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    workItemType: "User Story",
    title: "",
    description: "",
    state: "New",
    assignedTo: "",
    storyPoints: "",
    priority: "2",
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const params = new URLSearchParams();
      if (artifactOrgId) {
        params.append('artifactOrgId', artifactOrgId);
      } else if (organizationUrl) {
        params.append('organizationUrl', organizationUrl);
      }
      const url = `/api/hub/artifacts/${projectName}/work-item${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("POST", url, data);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/hub/artifacts/${projectName}/work-items`, artifactOrgId, organizationUrl] 
      });
      
      toast({
        title: "Success",
        description: "Work item created successfully in Azure DevOps",
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        workItemType: "User Story",
        title: "",
        description: "",
        state: "New",
        assignedTo: "",
        storyPoints: "",
        priority: "2",
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
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create work item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const createData: any = {
      workItemType: formData.workItemType,
      title: formData.title.trim(),
    };

    if (formData.description) createData.description = formData.description;
    if (formData.state) createData.state = formData.state;
    if (formData.assignedTo && formData.assignedTo.trim() !== "" && formData.assignedTo !== "Unassigned") {
      createData.assignedTo = formData.assignedTo.trim();
    }
    if (formData.storyPoints !== "" && formData.storyPoints !== null) {
      createData.storyPoints = parseFloat(formData.storyPoints);
    }
    if (formData.priority !== "" && formData.priority !== null) {
      createData.priority = parseInt(formData.priority);
    }
    if (formData.severity) createData.severity = formData.severity;
    if (formData.businessValue !== "" && formData.businessValue !== null) {
      createData.businessValue = parseFloat(formData.businessValue);
    }
    if (formData.timeCriticality !== "" && formData.timeCriticality !== null) {
      createData.timeCriticality = parseFloat(formData.timeCriticality);
    }
    if (formData.effort !== "" && formData.effort !== null) {
      createData.effort = parseFloat(formData.effort);
    }
    if (formData.remainingWork !== "" && formData.remainingWork !== null) {
      createData.remainingWork = parseFloat(formData.remainingWork);
    }
    if (formData.originalEstimate !== "" && formData.originalEstimate !== null) {
      createData.originalEstimate = parseFloat(formData.originalEstimate);
    }
    if (formData.completedWork !== "" && formData.completedWork !== null) {
      createData.completedWork = parseFloat(formData.completedWork);
    }
    if (formData.acceptanceCriteria) createData.acceptanceCriteria = formData.acceptanceCriteria;
    if (formData.reproSteps) createData.reproSteps = formData.reproSteps;
    if (formData.tags) createData.tags = formData.tags;

    createMutation.mutate(createData);
  };

  const isUserStory = formData.workItemType === "User Story";
  const isEpicOrFeature = formData.workItemType === "Epic" || formData.workItemType === "Feature";
  const isBug = formData.workItemType === "Bug";
  const isTaskOrIssue = formData.workItemType === "Task" || formData.workItemType === "Issue";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Work Item
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit} className="space-y-4 pr-4">
            {/* Work Item Type */}
            <div className="space-y-2">
              <Label htmlFor="workItemType">Work Item Type *</Label>
              <Select
                value={formData.workItemType}
                onValueChange={(value) => setFormData({ ...formData, workItemType: value })}
              >
                <SelectTrigger id="workItemType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User Story">User Story</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                  <SelectItem value="Bug">Bug</SelectItem>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Issue">Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter work item title..."
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

            {/* Time Tracking Fields */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Time Tracking</h3>
              
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
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={createMutation.isPending || !formData.title.trim()}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Work Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

