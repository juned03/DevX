import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";

interface WorkItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  itemType: "story" | "requirement" | "backlog" | "document" | "epic";
  projectId: string;
  phaseNumber: number;
}

export function WorkItemEditDialog({
  open,
  onOpenChange,
  item,
  itemType,
  projectId,
  phaseNumber,
}: WorkItemEditDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignedTo: "",
    storyPoints: "",
    category: "",
    content: "",
  });

  useEffect(() => {
    if (item && open) {
      setFormData({
        title: item.title || "",
        description: item.description || "",
        status: item.status || "todo",
        priority: item.priority || "medium",
        assignedTo: item.assignedTo || "",
        storyPoints: item.storyPoints?.toString() || "",
        category: item.category || "",
        content: item.content || "",
      });
    }
  }, [item, open]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      let endpoint = "";
      switch (itemType) {
        case "story":
        case "backlog":
          endpoint = `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/backlog/${item.id}`;
          break;
        case "requirement":
          endpoint = `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/requirements/${item.id}`;
          break;
        case "document":
          endpoint = `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/documents/${item.id}`;
          break;
        case "epic":
          endpoint = `/api/sdlc/projects/${projectId}/epics/${item.id}`;
          break;
      }
      
      const response = await fetch(getApiUrl(endpoint), {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to update item" }));
        throw new Error(error.message || "Failed to update item");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/backlog`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/requirements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/epics`] });
      
      toast({
        title: "Success",
        description: `${itemType === "story" ? "User story" : itemType} updated successfully`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update ${itemType}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // AI assistance mutation for improving descriptions
  const aiAssistMutation = useMutation({
    mutationFn: async ({ title, currentDescription }: { title: string; currentDescription: string }) => {
      const response = await fetch(getApiUrl("/api/ai/enhance-description"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description: currentDescription,
          itemType,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to enhance description" }));
        throw new Error(error.message || "Failed to enhance description");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, description: data.enhancedDescription }));
      toast({
        title: "Description Enhanced",
        description: "AI has improved your description",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to enhance description: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: any = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
    };

    if (formData.assignedTo) updateData.assignedTo = formData.assignedTo;
    if (formData.storyPoints) updateData.storyPoints = parseInt(formData.storyPoints);
    if (formData.category) updateData.category = formData.category;
    if (formData.content) updateData.content = formData.content;

    updateMutation.mutate(updateData);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit {itemType === "story" ? "User Story" : itemType}</DialogTitle>
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
                data-testid="input-edit-title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => aiAssistMutation.mutate({ 
                    title: formData.title, 
                    currentDescription: formData.description 
                  })}
                  disabled={!formData.title || aiAssistMutation.isPending}
                  className="h-7 px-2 text-xs gap-1"
                  data-testid="button-ai-enhance"
                >
                  {aiAssistMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Enhancing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      <span>AI Enhance</span>
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Enter description or click AI Enhance to generate one..."
                data-testid="textarea-edit-description"
              />
            </div>

            {/* Content (for documents) */}
            {itemType === "document" && (
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  data-testid="textarea-edit-content"
                />
              </div>
            )}

            {/* Category (for requirements) */}
            {itemType === "requirement" && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="select-edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="non-functional">Non-Functional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="select-edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assigned To & Story Points (for stories) */}
            {(itemType === "story" || itemType === "backlog") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    data-testid="input-edit-assigned"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storyPoints">Story Points</Label>
                  <Input
                    id="storyPoints"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.storyPoints}
                    onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                    data-testid="input-edit-points"
                  />
                </div>
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            data-testid="button-save-edit"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
