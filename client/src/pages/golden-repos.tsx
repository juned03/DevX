import { Button } from "@/components/ui/button";
import { RepoCard } from "@/components/repo-card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";
import type { GoldenRepository } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DomainNav } from "@/components/domain-nav";
import { useDomain, DOMAIN_CONFIG } from "@/contexts/domain-context";
import { useSDLCProject } from "@/context/sdlc-project-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function GoldenRepos() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedDomain } = useDomain();
  const { setProjectConfig } = useSDLCProject();
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [forkingRepo, setForkingRepo] = useState<any>(null);
  const [forkTargetOrgUrl, setForkTargetOrgUrl] = useState("https://dev.azure.com/DevXPlatform/");
  const [forkTargetProject, setForkTargetProject] = useState("");
  const [forkNewRepoName, setForkNewRepoName] = useState("");
  const [forkDescription, setForkDescription] = useState("");
  const [forkPat, setForkPat] = useState("");
  const [forkBranch, setForkBranch] = useState("");
  const [forkIncludePermissions, setForkIncludePermissions] = useState(false);
  const [forkMode, setForkMode] = useState<"same-org" | "cross-org">("same-org");
  const [sourcePat, setSourcePat] = useState("");
  const [isForkSubmitting, setIsForkSubmitting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch repositories from Azure DevOps
  const { data: adoData, isLoading } = useQuery({
    queryKey: ["/api/ado/golden-repositories"],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/ado/golden-repositories`));
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Azure DevOps settings not configured. Please configure in Settings page.");
        }
        throw new Error("Failed to fetch repositories from Azure DevOps");
      }
      return response.json();
    },
    retry: false,
  });

  const repos = adoData?.repositories || [];

  // Filter repositories based on search query
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) {
      return repos;
    }
    const query = searchQuery.toLowerCase();
    return repos.filter((repo: any) => 
      repo.name.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query))
    );
  }, [repos, searchQuery]);

  // Clear selection when domain changes
  useEffect(() => {
    setSelectedRepo(null);
  }, [selectedDomain]);

  // Create SDLC project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: { repositoryIds: string[], repositoryName: string }) => {
      const response = await apiRequest("POST", "/api/golden-repos/create-sdlc-project", data);
      return response.json();
    },
    onSuccess: async (project, variables) => {
      // Fetch Azure DevOps settings
      try {
        const adoResponse = await fetch(getApiUrl("/api/ado-settings"), { credentials: "include" });
        const adoSettings = await adoResponse.json();
        
        // Store configuration in SDLC Project context
        setProjectConfig({
          repositoryId: variables.repositoryIds[0],
          repositoryName: variables.repositoryName,
          azureOrganizationUrl: adoSettings.organizationUrl || "",
          azureProjectName: adoSettings.projectName || "",
          azureApiVersion: adoSettings.apiVersion || "7.0",
          isPatConfigured: adoSettings.patConfigured || false,
          sdlcProjectId: project.id,
          sdlcProjectName: project.name,
          createdAt: new Date().toISOString(),
        });
        
        toast({
          title: "SDLC Project Created",
          description: "Successfully created SDLC project with Azure DevOps configuration.",
        });
        
        setSelectedRepo(null);
        setLocation(`/sdlc?projectId=${project.id}`);
      } catch (error) {
        console.error("Failed to fetch Azure DevOps settings:", error);
        toast({
          title: "Warning",
          description: "SDLC project created but Azure DevOps configuration could not be loaded.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create SDLC project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRepoSelect = (id: string) => {
    setSelectedRepo(id);
  };

  const handleCreateProject = () => {
    if (!selectedRepo) return;
    const repo = repos.find((r: any) => r.id === selectedRepo);
    if (!repo) return;
    
    createProjectMutation.mutate({ 
      repositoryIds: [selectedRepo],
      repositoryName: repo.name 
    });
  };

  const handlePreview = (repoId: string) => {
    setLocation(`/golden-repos/preview?repoId=${repoId}`);
  };

  const handleFork = (repoId: string) => {
    const repo = repos.find((r: any) => r.id === repoId);
    if (!repo) return;

    setForkingRepo(repo);
    setForkTargetOrgUrl("https://dev.azure.com/DevXPlatform/");
    setForkTargetProject("");
    setForkNewRepoName(`${repo.name}-fork`);
    setForkDescription(`Forked from ${repo.name} for testing or feature development.`);
    setForkPat("");
    setForkBranch("");
    setForkIncludePermissions(false);
    setConnectionTestResult(null);
    setForkDialogOpen(true);
  };

  const handleTestConnection = async () => {
    if (!forkTargetOrgUrl.trim() || !forkTargetProject.trim() || !forkPat.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization URL, Project Name, and PAT are required for testing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTestingConnection(true);
      setConnectionTestResult(null);

      const response = await fetch(getApiUrl("/api/ado/test-connection"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          organizationUrl: forkTargetOrgUrl.trim(),
          projectName: forkTargetProject.trim(),
          pat: forkPat,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setConnectionTestResult({
          success: true,
          message: "Connection successful! You have access to the target project.",
        });
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Azure DevOps project",
        });
      } else {
        const errorMessage = result.details 
          ? `${result.error}\n\n${result.details}`
          : result.error || "Failed to connect to Azure DevOps";
        setConnectionTestResult({
          success: false,
          message: errorMessage,
        });
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to Azure DevOps",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: "Network error while testing connection",
      });
      toast({
        title: "Connection Test Failed",
        description: "Network error while testing connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleForkSubmit = async () => {
    if (!forkingRepo || !forkTargetOrgUrl.trim() || !forkTargetProject.trim() || !forkNewRepoName.trim() || !forkPat.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization URL, Project Name, Repository Name, and PAT are required",
        variant: "destructive",
      });
      return;
    }

    // Source PAT not required; server uses a configured source PAT for cross-org

    try {
      setIsForkSubmitting(true);

      const response = await fetch(getApiUrl("/api/ado/fork-repository"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sourceRepoId: forkingRepo.id,
          targetOrgUrl: forkTargetOrgUrl.trim(),
          targetProjectName: forkTargetProject.trim(),
          newRepoName: forkNewRepoName.trim(),
          description: forkDescription.trim(),
          pat: forkPat,
          branch: forkBranch.trim() || undefined,
          includePermissions: forkIncludePermissions,
          forkMode,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Repository Forked",
          description: `Successfully forked repository to ${forkTargetProject}/${forkNewRepoName}`,
        });

        setForkDialogOpen(false);
        handleForkCancel();
      } else {
        throw new Error(result.error || "Failed to fork repository");
      }
    } catch (error) {
      toast({
        title: "Fork Failed",
        description: error instanceof Error ? error.message : "Failed to fork repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsForkSubmitting(false);
    }
  };

  const handleForkCancel = () => {
    setForkDialogOpen(false);
    setForkingRepo(null);
    setForkTargetOrgUrl("https://dev.azure.com/DevXPlatform/");
    setForkTargetProject("");
    setForkNewRepoName("");
    setForkDescription("");
    setForkPat("");
    setForkBranch("");
    setForkIncludePermissions(false);
    setConnectionTestResult(null);
    setForkMode("same-org");
    setSourcePat("");
  };

  const handleDownload = async (repoId: string) => {
    try {
      const repo = repos.find((r: any) => r.id === repoId);
      if (!repo) return;

      console.log("Downloading repository:", repo.name, repoId);

      const response = await fetch(getApiUrl(`/api/ado/repository/${repoId}/download`), {
        credentials: "include",
      });

      console.log("Download response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Download failed with status:", response.status, errorText);
        throw new Error(`Failed to download repository: ${response.status} ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${repo.name || 'repository'}.zip`;
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      console.log("Downloading file:", filename);

      // Download the file
      const blob = await response.blob();
      console.log("Blob size:", blob.size, "bytes, type:", blob.type);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("Download initiated successfully");

      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download repository. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading repositories from Azure DevOps...
          </p>
        </div>
      </div>
    );
  }

  const domainConfig = DOMAIN_CONFIG[selectedDomain];

  return (
    <div className="flex-1 flex flex-col">
      <DomainNav />
      
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold" data-testid="heading-golden-repos">
                Golden Repositories
              </h1>
              <Badge className={`${domainConfig.bgColor} ${domainConfig.textColor} border-0`}>
                {domainConfig.label}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse and select template repositories for {domainConfig.label.toLowerCase()} projects
            </p>
          </div>
        {selectedRepo && (
          <Button 
            data-testid="button-confirm-selection"
            onClick={handleCreateProject}
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Project...
              </>
            ) : (
              "Create SDLC Project"
            )}
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search repositories..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-repos"
        />
      </div>

      <RadioGroup value={selectedRepo || ""} onValueChange={setSelectedRepo} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRepos.map((repo: any) => (
          <label key={repo.id} className="cursor-pointer flex items-stretch gap-3 min-w-0">
            <RadioGroupItem 
              value={repo.id}
              className="mt-4 shrink-0"
              data-testid={`radio-repo-${repo.name.toLowerCase().replace(/\s+/g, '-')}`}
            />
            <div className="flex-1 min-w-0 h-full">
              <RepoCard 
                id={repo.id}
                name={repo.name}
                description={repo.description}
                technologies={repo.technologies || []}
                domain={repo.domain || 'general'}
                stars={repo.commitCount || 0}
                contributors={repo.contributors || []}
                contributorCount={repo.contributorCount || 0}
                lastCommit={repo.lastCommit}
                isSelected={selectedRepo === repo.id}
                onSelect={() => handleRepoSelect(repo.id)}
                onPreview={() => handlePreview(repo.id)}
                onFork={() => handleFork(repo.id)}
                onDownload={() => handleDownload(repo.id)}
              />
            </div>
          </label>
        ))}
      </RadioGroup>
      </div>

      {/* Fork Dialog */}
      <Dialog open={forkDialogOpen} onOpenChange={setForkDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-fork-repo">
          <DialogHeader>
            <DialogTitle>Fork Repository</DialogTitle>
            <DialogDescription>
              Fork {forkingRepo?.name} to a new Azure DevOps repository. Enter the target configuration below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Fork Mode */}
            <div className="space-y-2">
              <Label data-testid="label-fork-mode">Fork Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={forkMode === "same-org" ? "default" : "outline"}
                  onClick={() => setForkMode("same-org")}
                  data-testid="button-fork-mode-same-org"
                >
                  Same organization
                </Button>
                <Button
                  type="button"
                  variant={forkMode === "cross-org" ? "default" : "outline"}
                  onClick={() => setForkMode("cross-org")}
                  data-testid="button-fork-mode-cross-org"
                >
                  Cross organization
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {forkMode === "same-org"
                  ? "Fork within the same Azure DevOps organization using native fork API."
                  : "Creates a new repository in the target organization and imports content from the source using Git import. Requires a PAT for the source organization."}
              </p>
            </div>

            {/* Target Organization URL */}
            <div className="space-y-2">
              <Label htmlFor="fork-org-url" data-testid="label-org-url">
                Target Organization URL (write) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fork-org-url"
                placeholder="https://dev.azure.com/YourTargetOrg/"
                value={forkTargetOrgUrl}
                onChange={(e) => setForkTargetOrgUrl(e.target.value)}
                data-testid="input-org-url"
              />
              <p className="text-xs text-muted-foreground">
                The URL of the Azure DevOps organization where the new repository will be created.
              </p>
            </div>

            {/* Target Project Name */}
            <div className="space-y-2">
              <Label htmlFor="fork-project" data-testid="label-target-project">
                Target Project Name (write) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fork-project"
                placeholder="Enter target project name"
                value={forkTargetProject}
                onChange={(e) => setForkTargetProject(e.target.value)}
                data-testid="input-target-project"
              />
              <p className="text-xs text-muted-foreground">
                The project within the target organization where the new repository will reside.
              </p>
            </div>

            {/* New Repository Name */}
            <div className="space-y-2">
              <Label htmlFor="fork-repo-name" data-testid="label-repo-name">
                New Repository Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fork-repo-name"
                placeholder="Enter new repository name"
                value={forkNewRepoName}
                onChange={(e) => setForkNewRepoName(e.target.value)}
                data-testid="input-repo-name"
              />
              <p className="text-xs text-muted-foreground">
                The name for the new repository in the target project.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="fork-description" data-testid="label-description">
                Description (Optional)
              </Label>
              <Textarea
                id="fork-description"
                placeholder="Forked from NousAugmentedDevX for testing..."
                value={forkDescription}
                onChange={(e) => setForkDescription(e.target.value)}
                rows={2}
                data-testid="input-description"
              />
            </div>

            {/* Source (read) */}
            {forkMode === "cross-org" && (
              <div className="space-y-1 pt-2">
                <div className="text-sm font-medium">Source (read)</div>
                <p className="text-xs text-muted-foreground">
                  The source is the current organization that hosts the golden repository you selected. No PAT input required; the server uses a configured source PAT.
                </p>
              </div>
            )}

            {/* Target (write) */}
            <div className="space-y-1 pt-2">
              <div className="text-sm font-medium">Target (write)</div>
              <p className="text-xs text-muted-foreground">
                The target is where the new repository will be created.
              </p>
            </div>

            {/* Target Personal Access Token */}
            <div className="space-y-2">
              <Label htmlFor="fork-pat" data-testid="label-pat">
                Target org PAT (write) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fork-pat"
                type="password"
                placeholder="Enter your Azure DevOps PAT for the target organization"
                value={forkPat}
                onChange={(e) => setForkPat(e.target.value)}
                data-testid="input-pat"
              />
              <p className="text-xs text-muted-foreground">
                PAT must have Code (Read & Write) permissions for the target organization.
              </p>
            </div>

            {/* Branch Selection */}
            <div className="space-y-2">
              <Label htmlFor="fork-branch" data-testid="label-branch">
                Branch Selection {forkMode === "cross-org" ? "(Not available for cross-org)" : "(Optional)"}
              </Label>
              <Input
                id="fork-branch"
                placeholder={forkMode === "cross-org" ? "Git import brings the whole repository" : "Leave empty for default branch"}
                value={forkBranch}
                onChange={(e) => setForkBranch(e.target.value)}
                disabled={forkMode === "cross-org"}
                data-testid="input-branch"
              />
              <p className="text-xs text-muted-foreground">
                {forkMode === "cross-org"
                  ? "Git import imports the entire repository history. Branch selection is not supported for cross-organization forks."
                  : "Specify a branch to fork only that branch (e.g., main, develop). Leave empty to fork the default branch."}
              </p>
            </div>

            {/* Include Permissions */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fork-permissions"
                checked={forkIncludePermissions}
                onCheckedChange={(checked) => setForkIncludePermissions(checked === true)}
                data-testid="checkbox-permissions"
              />
              <Label
                htmlFor="fork-permissions"
                className="text-sm font-normal cursor-pointer"
                data-testid="label-permissions"
              >
                Include permissions / security settings (if supported)
              </Label>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !forkTargetOrgUrl.trim() || !forkTargetProject.trim() || !forkPat.trim()}
                className="w-full"
                data-testid="button-test-connection"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            </div>

            {/* Connection Test Result */}
            {connectionTestResult && (
              <div className={`flex items-start gap-2 p-3 rounded-md ${
                connectionTestResult.success 
                  ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                  : "bg-destructive/10 text-destructive"
              }`} data-testid="connection-test-result">
                {connectionTestResult.success ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm whitespace-pre-line">{connectionTestResult.message}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleForkCancel}
              disabled={isForkSubmitting}
              data-testid="button-cancel-fork"
            >
              Cancel
            </Button>
            <Button
              onClick={handleForkSubmit}
              disabled={isForkSubmitting || !forkTargetOrgUrl.trim() || !forkTargetProject.trim() || !forkNewRepoName.trim() || !forkPat.trim()}
              data-testid="button-confirm-fork"
            >
              {isForkSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Forking Repository...
                </>
              ) : (
                "Fork Repository"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
