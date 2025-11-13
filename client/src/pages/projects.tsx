import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project-card";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SDLCProject } from "@shared/schema";

export default function Projects() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<SDLCProject[]>({
    queryKey: ["/api/sdlc/projects"],
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sdlc/projects/seed", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sdlc/projects"] });
    },
  });

  // Auto-seed on first load if no projects exist
  useEffect(() => {
    if (!isLoading && projects.length === 0 && !seedMutation.isPending) {
      seedMutation.mutate();
    }
  }, [isLoading, projects.length]);

  if (isLoading || seedMutation.isPending) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {seedMutation.isPending ? "Setting up projects..." : "Loading projects..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all your projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]" data-testid="select-filter-org">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              <SelectItem value="acme">Acme Corporation</SelectItem>
              <SelectItem value="tech">Tech Innovators</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-project"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            id={project.id}
            name={project.name}
            organization={project.organization || "Unknown Organization"}
            repoCount={project.repositoryCount || 0}
            cloudProvider={project.cloudProvider || undefined}
            status={project.status as "active" | "pending" | "archived"}
          />
        ))}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
