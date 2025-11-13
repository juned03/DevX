import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserStory, Persona } from "@shared/schema";
import { CheckCircle2 } from "lucide-react";

interface UserStoryModalProps {
  story: UserStory;
  persona: Persona;
  open: boolean;
  onClose: () => void;
}

const priorityColors = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Medium: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const personaColors = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

export function UserStoryModal({ story, persona, open, onClose }: UserStoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{story.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Persona Info - Simplified */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={personaColors[persona.color as keyof typeof personaColors]}>
                {persona.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{persona.name}</h3>
              <p className="text-xs text-muted-foreground">{persona.role}</p>
            </div>
          </div>

          {/* Story Details */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{story.description}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge className={priorityColors[story.priority]}>
                {story.priority} Priority
              </Badge>
              <Badge variant="secondary">{story.storyPoints} Points</Badge>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Acceptance Criteria
              </h4>
              <div className="space-y-2">
                {story.acceptanceCriteria.map((criteria, index) => {
                  // Handle both object format { given, when, then } and string format
                  const criteriaText = typeof criteria === 'string' 
                    ? criteria 
                    : `${criteria.given || ''} ${criteria.when || ''} ${criteria.then || ''}`.trim();
                  
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-muted rounded-md text-sm"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5">
                        {index + 1}
                      </div>
                      <p className="flex-1">
                        {criteriaText.split(/\b(Given|When|Then)\b/).map((part, i) => {
                          if (["Given", "When", "Then"].includes(part)) {
                            return (
                              <strong key={i} className="font-semibold text-foreground">
                                {part}
                              </strong>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtasks */}
            {story.subtasks && story.subtasks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Subtasks</h4>
                <div className="space-y-2">
                  {story.subtasks.map((subtask, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-muted rounded-md text-sm"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-xs mt-0.5">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-muted-foreground">{subtask}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
