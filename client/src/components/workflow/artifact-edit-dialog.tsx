import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Epic, Feature, UserStory } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ArtifactType = Epic | Feature | UserStory;

interface ArtifactEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: ArtifactType | null;
  artifactType: "epic" | "feature" | "story";
  onSave: (updatedArtifact: ArtifactType) => void;
}

export function ArtifactEditDialog({
  open,
  onOpenChange,
  artifact,
  artifactType,
  onSave,
}: ArtifactEditDialogProps) {
  const [editedArtifact, setEditedArtifact] = useState<ArtifactType | null>(null);
  const [subtasks, setSubtasks] = useState<string[]>([]);

  useEffect(() => {
    if (artifact) {
      setEditedArtifact({ ...artifact });
      if ('subtasks' in artifact && artifact.subtasks) {
        setSubtasks([...artifact.subtasks]);
      }
    }
  }, [artifact]);

  if (!editedArtifact) return null;

  const handleSave = () => {
    const updated = {
      ...editedArtifact,
      ...(artifactType === "story" && { subtasks }),
    };
    onSave(updated as ArtifactType);
    onOpenChange(false);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, ""]);
  };

  const updateSubtask = (index: number, value: string) => {
    const updated = [...subtasks];
    updated[index] = value;
    setSubtasks(updated);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const getTitle = () => {
    switch (artifactType) {
      case "epic": return "Edit Epic";
      case "feature": return "Edit Feature";
      case "story": return "Edit User Story";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Make changes to the {artifactType} details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editedArtifact.title || ""}
              onChange={(e) => setEditedArtifact({ ...editedArtifact, title: e.target.value })}
              data-testid="input-edit-title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editedArtifact.description || ""}
              onChange={(e) => setEditedArtifact({ ...editedArtifact, description: e.target.value })}
              className="h-24"
              data-testid="textarea-edit-description"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="edit-priority">Priority</Label>
            <Select
              value={editedArtifact.priority}
              onValueChange={(value: "High" | "Medium" | "Low") =>
                setEditedArtifact({ ...editedArtifact, priority: value })
              }
            >
              <SelectTrigger id="edit-priority" data-testid="select-edit-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Story Points (Story only) */}
          {artifactType === "story" && 'storyPoints' in editedArtifact && (
            <div className="space-y-2">
              <Label htmlFor="edit-story-points">Story Points</Label>
              <Input
                id="edit-story-points"
                type="number"
                min="1"
                max="13"
                value={editedArtifact.storyPoints || 1}
                onChange={(e) => setEditedArtifact({ ...editedArtifact, storyPoints: parseInt(e.target.value) || 1 })}
                data-testid="input-edit-story-points"
              />
            </div>
          )}

          {/* Persona (Story only) */}
          {artifactType === "story" && 'persona' in editedArtifact && (
            <div className="space-y-2">
              <Label htmlFor="edit-persona">Persona</Label>
              <Input
                id="edit-persona"
                value={editedArtifact.persona || ""}
                onChange={(e) => setEditedArtifact({ ...editedArtifact, persona: e.target.value })}
                data-testid="input-edit-persona"
              />
            </div>
          )}

          {/* Subtasks (Story only) */}
          {artifactType === "story" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subtasks</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubtask}
                  data-testid="button-add-subtask"
                >
                  Add Subtask
                </Button>
              </div>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Subtask description"
                      value={subtask}
                      onChange={(e) => updateSubtask(index, e.target.value)}
                      className="flex-1"
                      data-testid={`input-subtask-${index}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubtask(index)}
                      data-testid={`button-remove-subtask-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-artifact">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
