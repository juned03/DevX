import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit, X, CheckCircle2, Calendar, User, Target } from "lucide-react";
import { useState } from "react";
import { WorkItemEditDialog } from "./work-item-edit-dialog";

interface WorkItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  itemType: "story" | "requirement" | "backlog" | "document" | "epic";
  projectId: string;
  phaseNumber: number;
}

export function WorkItemDetailsDialog({
  open,
  onOpenChange,
  item,
  itemType,
  projectId,
  phaseNumber,
}: WorkItemDetailsDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!item) return null;

  const getStatusColor = (status: unknown) => {
    const normalized = typeof status === "string" ? status.toLowerCase() : (status == null ? "" : String(status).toLowerCase());
    switch (normalized) {
      case "done":
      case "completed":
        return "default";
      case "in_progress":
      case "in-progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: unknown) => {
    const normalized = typeof priority === "string" ? priority.toLowerCase() : (priority == null ? "" : String(priority).toLowerCase());
    switch (normalized) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold pr-8">
                  {item.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-3">
                  {item.status && (
                    <Badge variant={getStatusColor(item.status)} data-testid="badge-item-status">
                      {item.status}
                    </Badge>
                  )}
                  {item.priority && (
                    <Badge variant={getPriorityColor(item.priority)} data-testid="badge-item-priority">
                      {item.priority}
                    </Badge>
                  )}
                  {item.type && (
                    <Badge variant="outline" data-testid="badge-item-type">
                      {item.type}
                    </Badge>
                  )}
                  {item.storyPoints && (
                    <Badge variant="outline" data-testid="badge-story-points">
                      <Target className="h-3 w-3 mr-1" />
                      {item.storyPoints} points
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                data-testid="button-edit-item"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </DialogHeader>

          <Separator />

          <ScrollArea className="flex-1 px-6 pb-6">
            <div className="space-y-6 pt-4">
              {/* Description */}
              {item.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                    {item.description}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                {item.assignedTo && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assigned To
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.assignedTo}</p>
                  </div>
                )}
                {item.createdAt && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Created
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Acceptance Criteria */}
              {item.acceptanceCriteria && item.acceptanceCriteria.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Acceptance Criteria</h3>
                  <div className="space-y-3">
                    {item.acceptanceCriteria.map((ac: any, idx: number) => (
                      <Card key={idx} className="bg-muted/30">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm font-medium flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                            {ac.title || `Acceptance Criterion ${idx + 1}`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2 text-sm">
                          {ac.given && (
                            <div>
                              <span className="font-medium text-blue-600">Given:</span>{" "}
                              <span className="text-muted-foreground">{ac.given}</span>
                            </div>
                          )}
                          {ac.when && (
                            <div>
                              <span className="font-medium text-purple-600">When:</span>{" "}
                              <span className="text-muted-foreground">{ac.when}</span>
                            </div>
                          )}
                          {ac.then && (
                            <div>
                              <span className="font-medium text-green-600">Then:</span>{" "}
                              <span className="text-muted-foreground">{ac.then}</span>
                            </div>
                          )}
                          {ac.and && (
                            <div>
                              <span className="font-medium text-orange-600">And:</span>{" "}
                              <span className="text-muted-foreground">{ac.and}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {item.subtasks && item.subtasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Subtasks</h3>
                  <div className="space-y-2">
                    {item.subtasks.map((subtask: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/30"
                        data-testid={`subtask-${idx}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{subtask}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content (for documents) */}
              {item.content && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Content</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                    {item.content}
                  </div>
                </div>
              )}

              {/* Category (for requirements) */}
              {item.category && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Category</h3>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <WorkItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={item}
        itemType={itemType}
        projectId={projectId}
        phaseNumber={phaseNumber}
      />
    </>
  );
}
