import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Target, AlertCircle, CheckCircle, Users, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Persona {
  id: string;
  name: string;
  role: string;
  color: string;
  focus: string;
  painPoints: string[];
  goals: string[];
}

interface PersonaSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selectedPersonaIds: string[];
  onConfirm: (selectedIds: string[]) => void;
}

export function PersonaSelectorModal({
  open,
  onClose,
  selectedPersonaIds,
  onConfirm
}: PersonaSelectorModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedPersonaIds);
  const [previewPersona, setPreviewPersona] = useState<Persona | null>(null);
  const { toast } = useToast();

  // Fetch personas from API
  const { data: personas = [], isLoading, error } = useQuery({
    queryKey: ["personas"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/personas");
      return await response.json() as Persona[];
    },
    enabled: open, // Only fetch when modal is open
  });

  // Initialize default personas if none exist
  useEffect(() => {
    if (open && !isLoading && personas.length === 0 && !error) {
      const initializePersonas = async () => {
        try {
          await apiRequest("POST", "/api/personas/initialize");
          // Refetch will happen automatically due to query invalidation
          window.location.reload(); // Simple reload to refetch
        } catch (err) {
          console.error("Error initializing personas:", err);
          toast({
            title: "Error",
            description: "Failed to initialize default personas",
            variant: "destructive",
          });
        }
      };
      initializePersonas();
    }
  }, [open, isLoading, personas.length, error, toast]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedIds(selectedPersonaIds);
      setPreviewPersona(null);
    }
  }, [open, selectedPersonaIds]);

  const togglePersona = (personaId: string) => {
    setSelectedIds(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedIds);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedIds(personas.map((p: Persona) => p.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const selectedCount = selectedIds.length;

  // Show loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading personas...</p>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error state
  if (error) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error Loading Personas</DialogTitle>
            <DialogDescription>
              Failed to load personas from the database. Please try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Personas for User Stories
          </DialogTitle>
          <DialogDescription>
            Choose the personas that will guide the generation of user stories. Selected personas will be used to create stories in the format: "As a [persona], I want [goal] so that [benefit]."
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 px-6 overflow-hidden">
          {/* Left Panel - Persona List */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">
                Available Personas ({personas.length})
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={selectedIds.length === personas.length}
                  data-testid="button-select-all-personas"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={selectedIds.length === 0}
                  data-testid="button-clear-all-personas"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-2">
                {personas.map((persona: Persona) => {
                  const isSelected = selectedIds.includes(persona.id);
                  const isPreview = previewPersona?.id === persona.id;

                  return (
                    <Card
                      key={persona.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isSelected && "border-primary shadow-sm",
                        isPreview && "ring-2 ring-primary/20"
                      )}
                      onClick={() => togglePersona(persona.id)}
                      data-testid={`persona-card-${persona.id}`}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePersona(persona.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                            data-testid={`checkbox-persona-${persona.id}`}
                          />
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: persona.color }}
                          >
                            {persona.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{persona.name}</CardTitle>
                            <CardDescription className="truncate">{persona.role}</CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPersona(persona);
                            }}
                            data-testid={`button-preview-${persona.id}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Focus</p>
                            <p className="text-sm line-clamp-2">{persona.focus}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{persona.painPoints.length} pain points</span>
                            <span>{persona.goals.length} goals</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Persona Preview */}
          {previewPersona && (
            <div className="w-[360px] flex-shrink-0 border-l pl-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium">Preview</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewPersona(null)}
                >
                  Close
                </Button>
              </div>

              <ScrollArea className="h-[calc(100%-3rem)]">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: previewPersona.color }}
                      >
                        {previewPersona.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{previewPersona.name}</CardTitle>
                        <CardDescription>{previewPersona.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 space-y-5">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Focus
                      </h4>
                      <p className="text-sm text-muted-foreground">{previewPersona.focus}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Pain Points
                      </h4>
                      <div className="space-y-2">
                        {previewPersona.painPoints.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50">
                            <Badge variant="destructive" className="mt-0.5 text-xs">
                              {idx + 1}
                            </Badge>
                            <p className="text-xs flex-1">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Goals
                      </h4>
                      <div className="space-y-2">
                        {previewPersona.goals.map((goal, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50">
                            <Badge variant="secondary" className="mt-0.5 text-xs">
                              {idx + 1}
                            </Badge>
                            <p className="text-xs flex-1">{goal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedCount === 0 ? (
                "No personas selected"
              ) : (
                <>
                  <span className="font-medium text-foreground">{selectedCount}</span>{" "}
                  {selectedCount === 1 ? "persona" : "personas"} selected
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} data-testid="button-cancel-persona-selection">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                data-testid="button-confirm-persona-selection"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
