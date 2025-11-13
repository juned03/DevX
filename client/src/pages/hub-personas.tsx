import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Target, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Persona {
  id: string;
  name: string;
  role: string;
  color: string;
  focus: string;
  painPoints: string[];
  goals: string[];
}

export default function HubPersonas() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Persona>>({
    name: "",
    role: "",
    focus: "",
    color: "#3b82f6",
    painPoints: [""],
    goals: [""]
  });

  // Fetch personas from API
  const { data: personas = [], isLoading } = useQuery({
    queryKey: ["personas"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/personas");
      return await response.json() as Persona[];
    },
  });

  // Initialize default personas if none exist
  useEffect(() => {
    if (!isLoading && personas.length === 0) {
      const initializePersonas = async () => {
        try {
          await apiRequest("POST", "/api/personas/initialize");
          queryClient.invalidateQueries({ queryKey: ["personas"] });
        } catch (err) {
          console.error("Error initializing personas:", err);
        }
      };
      initializePersonas();
    }
  }, [isLoading, personas.length]);

  // Create persona mutation
  const createPersonaMutation = useMutation({
    mutationFn: async (data: Omit<Persona, "id">) => {
      const response = await apiRequest("POST", "/api/personas", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      toast({
        title: "Persona Created",
        description: `${formData.name} has been created successfully.`
      });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create persona",
        variant: "destructive"
      });
    }
  });

  // Update persona mutation
  const updatePersonaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Persona> }) => {
      const response = await apiRequest("PATCH", `/api/personas/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      toast({
        title: "Persona Updated",
        description: `${formData.name} has been updated successfully.`
      });
      setDialogOpen(false);
      if (selectedPersona) {
        setSelectedPersona(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update persona",
        variant: "destructive"
      });
    }
  });

  const handleAddPainPoint = () => {
    setFormData({
      ...formData,
      painPoints: [...(formData.painPoints || [""]), ""]
    });
  };

  const handleAddGoal = () => {
    setFormData({
      ...formData,
      goals: [...(formData.goals || [""]), ""]
    });
  };

  const handleOpenDialog = (persona?: Persona) => {
    if (persona) {
      setFormData(persona);
      setIsEditing(true);
    } else {
      setFormData({
        name: "",
        role: "",
        focus: "",
        color: "#3b82f6",
        painPoints: [""],
        goals: [""]
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (isEditing && selectedPersona) {
      updatePersonaMutation.mutate({ 
        id: selectedPersona.id, 
        data: formData as Partial<Persona>
      });
    } else {
      createPersonaMutation.mutate(formData as Omit<Persona, "id">);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading personas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Persona Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage user personas for better product planning
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-new-persona">
          <Plus className="h-4 w-4 mr-2" />
          New Persona
        </Button>
      </div>

      {selectedPersona ? (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPersona(null)}
            data-testid="button-back"
          >
            ← Back to Personas
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: selectedPersona.color }}
                  >
                    {selectedPersona.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{selectedPersona.name}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {selectedPersona.role}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleOpenDialog(selectedPersona)}
                  data-testid="button-edit-persona"
                >
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Focus
                </h3>
                <p className="text-muted-foreground">{selectedPersona.focus}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Pain Points
                </h3>
                <div className="space-y-2">
                  {selectedPersona.painPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                      <Badge variant="destructive" className="mt-0.5">
                        {idx + 1}
                      </Badge>
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Goals
                </h3>
                <div className="space-y-2">
                  {selectedPersona.goals.map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                      <Badge variant="secondary" className="mt-0.5">
                        {idx + 1}
                      </Badge>
                      <p className="text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona: Persona) => (
            <Card
              key={persona.id}
              className="hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => setSelectedPersona(persona)}
              data-testid={`card-persona-${persona.id}`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                    style={{ backgroundColor: persona.color }}
                  >
                    {persona.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{persona.name}</CardTitle>
                    <CardDescription className="truncate">{persona.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Persona" : "Create New Persona"}</DialogTitle>
            <DialogDescription>
              Define user personas to better understand your target audience
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[600px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sarah Chen"
                    data-testid="input-persona-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Product Manager"
                    data-testid="input-persona-role"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus">Focus</Label>
                <Input
                  id="focus"
                  value={formData.focus}
                  onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                  placeholder="What is their main focus?"
                  data-testid="input-persona-focus"
                />
              </div>

              <div className="space-y-2">
                <Label>Pain Points</Label>
                {formData.painPoints?.map((point, idx) => (
                  <Input
                    key={idx}
                    value={point}
                    onChange={(e) => {
                      const updated = [...(formData.painPoints || [])];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, painPoints: updated });
                    }}
                    placeholder={`Pain point ${idx + 1}`}
                    data-testid={`input-pain-point-${idx}`}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddPainPoint}
                  data-testid="button-add-pain-point"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Pain Point
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Goals</Label>
                {formData.goals?.map((goal, idx) => (
                  <Input
                    key={idx}
                    value={goal}
                    onChange={(e) => {
                      const updated = [...(formData.goals || [])];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, goals: updated });
                    }}
                    placeholder={`Goal ${idx + 1}`}
                    data-testid={`input-goal-${idx}`}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddGoal}
                  data-testid="button-add-goal"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Goal
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleSave} data-testid="button-save-persona">
                  {isEditing ? "Update" : "Create"} Persona
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
