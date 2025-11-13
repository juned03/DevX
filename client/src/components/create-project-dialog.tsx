import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Search } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { GoldenRepository } from "@shared/schema";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [cloudProvider, setCloudProvider] = useState("");
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch golden repositories
  const { data: repositories = [], isLoading } = useQuery<GoldenRepository[]>({
    queryKey: ["/api/golden-repos"],
    enabled: open,
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/sdlc/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sdlc/projects"] });
      toast({ title: "Project created successfully" });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to create project",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setProjectName("");
    setDescription("");
    setOrganization("");
    setCloudProvider("");
    setSelectedRepoIds([]);
    setSearchQuery("");
  };

  const toggleRepoSelection = (repoId: string) => {
    setSelectedRepoIds(prev => 
      prev.includes(repoId) 
        ? prev.filter(id => id !== repoId)
        : [...prev, repoId]
    );
  };

  const handleCreate = () => {
    if (!projectName.trim()) {
      toast({ title: "Project name is required", variant: "destructive" });
      return;
    }

    if (!organization.trim()) {
      toast({ title: "Organization is required", variant: "destructive" });
      return;
    }

    const data = {
      name: projectName.trim(),
      description: description.trim() || null,
      organization: organization.trim(),
      cloudProvider: cloudProvider || null,
      repositoryId: selectedRepoIds.length > 0 ? selectedRepoIds[0] : null,
      repositoryCount: selectedRepoIds.length,
      status: "active",
    };

    createMutation.mutate(data);
  };

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-create-project">Create New SDLC Project</DialogTitle>
          <DialogDescription>
            Create a new project and optionally link it to a golden repository template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Project Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  data-testid="input-project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization *</Label>
                <Input
                  id="organization"
                  data-testid="input-organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                data-testid="input-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudProvider">Cloud Provider</Label>
              <Select value={cloudProvider} onValueChange={setCloudProvider}>
                <SelectTrigger id="cloudProvider" data-testid="select-cloud-provider">
                  <SelectValue placeholder="Select cloud provider (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Azure">Azure</SelectItem>
                  <SelectItem value="AWS">AWS</SelectItem>
                  <SelectItem value="GitHub">GitHub</SelectItem>
                  <SelectItem value="GitLab">GitLab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Golden Repository Selection */}
          <div className="space-y-4 p-4 border rounded-md">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Link Golden Repositories (Optional)
                {selectedRepoIds.length > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({selectedRepoIds.length} selected)
                  </span>
                )}
              </h3>
              {selectedRepoIds.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedRepoIds([])}
                  data-testid="button-clear-selection"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories..."
                className="pl-9"
                data-testid="input-search-repos"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRepos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-8">
                {searchQuery ? "No repositories found matching your search" : "No golden repositories available"}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => toggleRepoSelection(repo.id)}
                    className={`w-full p-3 border rounded-md text-left hover-elevate active-elevate-2 ${
                      selectedRepoIds.includes(repo.id) ? 'border-primary bg-accent' : ''
                    }`}
                    data-testid={`repo-option-${repo.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{repo.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {repo.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {repo.technologies.slice(0, 3).map((tech, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {repo.technologies.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{repo.technologies.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedRepoIds.includes(repo.id) && (
                        <div className="ml-2 shrink-0">
                          <Badge variant="default">Selected</Badge>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
              className="flex-1"
              data-testid="button-create-project"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
