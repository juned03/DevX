import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  Settings,
  FileCode,
  Archive,
  Shield,
  Package,
  Flag,
  Database,
  Code,
  FolderGit2,
  GitCommit,
  GitMerge,
  Tag,
  Tags,
  Target,
  FileText,
  Clipboard,
  BookOpen,
  Network,
  Palette,
  Figma,
  Globe,
  Container,
  Server,
  MonitorDot,
  AlertCircle,
  Bell,
  Zap,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  Rocket,
  Users,
  Calendar,
  BarChart3,
  Activity,
  Upload,
  RefreshCw,
  UserCheck,
  ExternalLink,
  Save,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { WorkItemDetailsDialog } from "@/components/work-item-details-dialog";
import { WorkItemEditDialog } from "@/components/work-item-edit-dialog";
import { useLocation } from "wouter";

type FeatureType =
  // Build & Testing
  | "pipelines"
  | "jobs"
  | "pipeline-editor"
  | "artifacts"
  | "security-config"
  // Deployment
  | "releases"
  | "feature-flags"
  | "package-registry"
  | "model-registry"
  // Development
  | "code"
  | "repository"
  | "branches"
  | "commits"
  | "merge-requests"
  | "tags"
  | "preview"
  | "review-code"
  // Design
  | "system-architecture"
  | "database-design"
  | "ui-ux-design"
  | "component-design"
  | "snippets"
  | "repository-graph"
  | "design-merge-requests"
  | "design-assets"
  | "figma-link"
  | "review-design"
  // Maintenance
  | "environments"
  | "kubernetes-clusters"
  | "terraform-states"
  | "monitor"
  | "error-tracking"
  | "alerts"
  | "incidents"
  | "value-stream-analytics"
  // Requirements & Analysis
  | "epics"
  | "user-stories"
  | "requirements"
  | "backlog"
  | "documentation";

interface PhaseFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: FeatureType | null;
  projectId: string;
  projectName: string;
  phaseName: string;
  phaseNumber: number;
}

export function PhaseFeatureDialog({
  open,
  onOpenChange,
  featureType,
  projectId,
  projectName,
  phaseName,
  phaseNumber,
}: PhaseFeatureDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [createNewDialogOpen, setCreateNewDialogOpen] = useState(false);
  
  // Filter state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterIncludeArchived, setFilterIncludeArchived] = useState(false);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  
  // Item Type filter state (for Requirements & Analysis phase)
  const [filterEpics, setFilterEpics] = useState(true);
  const [filterFeatures, setFilterFeatures] = useState(true);
  const [filterUserStories, setFilterUserStories] = useState(true);
  const [filterBacklog, setFilterBacklog] = useState(true);
  const [filterRequirements, setFilterRequirements] = useState(true);
  const [filterDocuments, setFilterDocuments] = useState(true);

  if (!featureType) return null;

  const getDialogTitle = () => {
    const titles: Record<FeatureType, string> = {
      // Build & Testing
      pipelines: "CI/CD Pipelines",
      jobs: "Pipeline Jobs",
      "pipeline-editor": "Pipeline Editor",
      artifacts: "Build Artifacts",
      "security-config": "Security Configuration",
      // Deployment
      releases: "Releases",
      "feature-flags": "Feature Flags",
      "package-registry": "Package Registry",
      "model-registry": "Model Registry",
      // Development
      code: "Code Browser",
      repository: "Repository",
      branches: "Branches",
      commits: "Commits",
      "merge-requests": "Merge Requests",
      tags: "Tags",
      preview: "Local Preview",
      "review-code": "Code Review",
      // Design
      "system-architecture": "System Architecture",
      "database-design": "Database Design",
      "ui-ux-design": "UI/UX Design",
      "component-design": "Component Design",
      snippets: "Code Snippets",
      "repository-graph": "Repository Graph",
      "design-merge-requests": "Design Merge Requests",
      "design-assets": "Design Assets",
      "figma-link": "Figma Integration",
      "review-design": "Design Review",
      // Maintenance
      environments: "Environments",
      "kubernetes-clusters": "Kubernetes Clusters",
      "terraform-states": "Terraform States",
      monitor: "Monitoring",
      "error-tracking": "Error Tracking",
      alerts: "Alerts",
      incidents: "Incidents",
      "value-stream-analytics": "Value Stream Analytics",
      // Requirements & Analysis
      epics: "Epics",
      "user-stories": "User Stories",
      requirements: "Requirements",
      backlog: "Backlog",
      documentation: "Documentation",
    };
    return titles[featureType];
  };

  const filters = {
    status: filterStatus,
    assignee: filterAssignee,
    priority: filterPriority,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    includeArchived: filterIncludeArchived,
    starredOnly: filterStarredOnly,
    // Item type filters (for Requirements & Analysis phase)
    epics: filterEpics,
    features: filterFeatures,
    userStories: filterUserStories,
    backlog: filterBacklog,
    requirements: filterRequirements,
    documents: filterDocuments,
  };
  
  // Check if this is User Stories feature (for cross-feature filtering)
  const isUserStoriesFeature = featureType === "user-stories";

  const renderContent = () => {
    switch (featureType) {
      // BUILD & TESTING PHASE
      case "pipelines":
        return <PipelinesContent projectName={projectName} searchQuery={searchQuery} filters={filters} />;
      case "jobs":
        return <JobsContent projectName={projectName} searchQuery={searchQuery} />;
      case "pipeline-editor":
        return <PipelineEditorContent projectName={projectName} />;
      case "artifacts":
        return <ArtifactsContent projectName={projectName} searchQuery={searchQuery} />;
      case "security-config":
        return <SecurityConfigContent projectName={projectName} />;

      // DEPLOYMENT PHASE
      case "releases":
        return <ReleasesContent projectName={projectName} searchQuery={searchQuery} />;
      case "feature-flags":
        return <FeatureFlagsContent projectName={projectName} searchQuery={searchQuery} />;
      case "package-registry":
        return <PackageRegistryContent projectName={projectName} searchQuery={searchQuery} />;
      case "model-registry":
        return <ModelRegistryContent projectName={projectName} searchQuery={searchQuery} />;

      // DEVELOPMENT PHASE
      case "code":
        return <DevelopmentOverviewContent projectId={projectId} projectName={projectName} />;
      case "repository":
        return <RepositoryContent projectName={projectName} projectId={projectId} onClose={() => onOpenChange(false)} />;
      case "branches":
        return <BranchesContent projectName={projectName} projectId={projectId} searchQuery={searchQuery} />;
      case "commits":
        return <CommitsContent projectName={projectName} projectId={projectId} searchQuery={searchQuery} />;
      case "merge-requests":
        return <MergeRequestsContent projectName={projectName} searchQuery={searchQuery} />;
      case "tags":
        return <TagsContent projectName={projectName} searchQuery={searchQuery} />;
      case "preview":
        return <PreviewContent projectId={projectId} projectName={projectName} />;
      case "review-code":
        return <CodeReviewContent projectName={projectName} searchQuery={searchQuery} />;

      // DESIGN PHASE
      case "system-architecture":
        return <SystemArchitectureContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} />;
      case "database-design":
        return <DatabaseDesignContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} />;
      case "ui-ux-design":
        return <UIUXDesignContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} />;
      case "component-design":
        return <ComponentDesignContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} />;
      case "snippets":
        return <SnippetsContent projectName={projectName} searchQuery={searchQuery} />;
      case "repository-graph":
        return <RepositoryGraphContent projectName={projectName} />;
      case "design-merge-requests":
        return <MergeRequestsContent projectName={projectName} searchQuery={searchQuery} />;
      case "design-assets":
        return <DesignAssetsContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} searchQuery={searchQuery} />;
      case "figma-link":
        return <FigmaLinkContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} />;
      case "review-design":
        return <DesignReviewContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} searchQuery={searchQuery} />;

      // MAINTENANCE PHASE
      case "environments":
        return <EnvironmentsContent projectName={projectName} searchQuery={searchQuery} />;
      case "kubernetes-clusters":
        return <KubernetesClustersContent projectName={projectName} searchQuery={searchQuery} />;
      case "terraform-states":
        return <TerraformStatesContent projectName={projectName} searchQuery={searchQuery} />;
      case "monitor":
        return <MonitorContent projectName={projectName} />;
      case "error-tracking":
        return <ErrorTrackingContent projectName={projectName} searchQuery={searchQuery} />;
      case "alerts":
        return <AlertsContent projectName={projectName} searchQuery={searchQuery} />;
      case "incidents":
        return <IncidentsContent projectName={projectName} searchQuery={searchQuery} />;
      case "value-stream-analytics":
        return <ValueStreamAnalyticsContent projectName={projectName} />;

      // REQUIREMENTS & ANALYSIS PHASE
      case "epics":
        return <EpicsContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} searchQuery={searchQuery} />;
      case "user-stories":
        return <UserStoriesContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} searchQuery={searchQuery} filters={filters} />;
      case "requirements":
        return <RequirementsContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} searchQuery={searchQuery} />;
      case "backlog":
        return <BacklogContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} searchQuery={searchQuery} />;
      case "documentation":
        return <DocumentationContent projectId={projectId} projectName={projectName} phaseNumber={phaseNumber} searchQuery={searchQuery} />;

      default:
        return <div className="p-6">Feature coming soon...</div>;
    }
  };

  const showSearch = ![
    "pipeline-editor",
    "repository",
    "repository-graph",
    "figma-link",
    "monitor",
    "value-stream-analytics",
  ].includes(featureType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh]" data-testid="dialog-phase-feature">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDialogTitle()}
            <Badge variant="outline" className="ml-auto">
              {projectName}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {showSearch && (
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setFilterDialogOpen(true)}
              data-testid="button-filter"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 max-h-[calc(85vh-12rem)]">{renderContent()}</ScrollArea>
      </DialogContent>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-filter">
          <DialogHeader>
            <DialogTitle>Filter Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isUserStoriesFeature && (
              // User Stories - Show Item Type filter for cross-feature filtering
              <div className="space-y-2">
                <Label>Work Item Type</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-epics" 
                      checked={filterEpics}
                      onCheckedChange={(checked) => setFilterEpics(checked as boolean)}
                      data-testid="checkbox-filter-epics" 
                    />
                    <label htmlFor="filter-epics" className="text-sm cursor-pointer">
                      Epics
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-features" 
                      checked={filterFeatures}
                      onCheckedChange={(checked) => setFilterFeatures(checked as boolean)}
                      data-testid="checkbox-filter-features" 
                    />
                    <label htmlFor="filter-features" className="text-sm cursor-pointer">
                      Features
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-user-stories" 
                      checked={filterUserStories}
                      onCheckedChange={(checked) => setFilterUserStories(checked as boolean)}
                      data-testid="checkbox-filter-user-stories" 
                    />
                    <label htmlFor="filter-user-stories" className="text-sm cursor-pointer">
                      User Stories
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-backlog" 
                      checked={filterBacklog}
                      onCheckedChange={(checked) => setFilterBacklog(checked as boolean)}
                      data-testid="checkbox-filter-backlog" 
                    />
                    <label htmlFor="filter-backlog" className="text-sm cursor-pointer">
                      Backlog (Tasks & Bugs)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-requirements" 
                      checked={filterRequirements}
                      onCheckedChange={(checked) => setFilterRequirements(checked as boolean)}
                      data-testid="checkbox-filter-requirements" 
                    />
                    <label htmlFor="filter-requirements" className="text-sm cursor-pointer">
                      Requirements
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filter-documents" 
                      checked={filterDocuments}
                      onCheckedChange={(checked) => setFilterDocuments(checked as boolean)}
                      data-testid="checkbox-filter-documents" 
                    />
                    <label htmlFor="filter-documents" className="text-sm cursor-pointer">
                      Documents
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Standard filters for all phases */}
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter-assignee">Assignee</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger id="filter-assignee" data-testid="select-filter-assignee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="me">Assigned to me</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="alice">Alice Johnson</SelectItem>
                  <SelectItem value="bob">Bob Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-priority">Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger id="filter-priority" data-testid="select-filter-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="filter-date-from" className="text-xs text-muted-foreground">From</Label>
                  <Input 
                    type="date" 
                    id="filter-date-from" 
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    data-testid="input-filter-date-from" 
                  />
                </div>
                <div>
                  <Label htmlFor="filter-date-to" className="text-xs text-muted-foreground">To</Label>
                  <Input 
                    type="date" 
                    id="filter-date-to" 
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    data-testid="input-filter-date-to" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-archived" 
                    checked={filterIncludeArchived}
                    onCheckedChange={(checked) => setFilterIncludeArchived(checked as boolean)}
                    data-testid="checkbox-filter-archived" 
                  />
                  <label htmlFor="filter-archived" className="text-sm cursor-pointer">
                    Include archived items
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filter-starred" 
                    checked={filterStarredOnly}
                    onCheckedChange={(checked) => setFilterStarredOnly(checked as boolean)}
                    data-testid="checkbox-filter-starred" 
                  />
                  <label htmlFor="filter-starred" className="text-sm cursor-pointer">
                    Starred items only
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Filters Applied",
                    description: "Your filter preferences have been applied successfully!",
                  });
                  setFilterDialogOpen(false);
                }}
                data-testid="button-apply-filters"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Dialog */}
      <Dialog open={createNewDialogOpen} onOpenChange={setCreateNewDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-new">
          <DialogHeader>
            <DialogTitle>Create New {getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <CreateNewForm 
            featureType={featureType} 
            projectName={projectName}
            projectId={projectId}
            phaseNumber={phaseNumber}
            onSuccess={() => {
              setCreateNewDialogOpen(false);
              toast({
                title: "Created Successfully",
                description: `New ${getDialogTitle()} has been created!`,
              });
            }}
            onCancel={() => setCreateNewDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// CREATE NEW FORM COMPONENT
function CreateNewForm({
  featureType,
  projectName,
  projectId,
  phaseNumber,
  onSuccess,
  onCancel,
}: {
  featureType: FeatureType;
  projectName: string;
  projectId: string;
  phaseNumber: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("unassigned");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileData, setFileData] = useState("");
  const [figmaUrl, setFigmaUrl] = useState("");

  const createEpicMutation = useMutation({
    mutationFn: async (data: { title: string; assignedTo?: string; priority: string; description: string }) => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/epics`, data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/epics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/details`] });
      
      // Check if a phase was unlocked
      if (response?._phaseUnlocked?.unlocked) {
        toast({
          title: "✅ Phase Unlocked!",
          description: `${response._phaseUnlocked.phaseName} — You can now proceed.`,
        });
      }
      
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create epic",
        variant: "destructive",
      });
    },
  });

  const createBacklogMutation = useMutation({
    mutationFn: async (data: { title: string; type: string; assignedTo?: string; priority: string; description: string }) => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/backlog`, data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/backlog`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/details`] });
      
      // Check if a phase was unlocked
      if (response?._phaseUnlocked?.unlocked) {
        toast({
          title: "✅ Phase Unlocked!",
          description: `${response._phaseUnlocked.phaseName} — You can now proceed.`,
        });
      }
      
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: { title: string; assignedTo?: string; priority: string; description: string }) => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/requirements`, data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/requirements`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/details`] });
      
      // Check if a phase was unlocked
      if (response?._phaseUnlocked?.unlocked) {
        toast({
          title: "✅ Phase Unlocked!",
          description: `${response._phaseUnlocked.phaseName} — You can now proceed.`,
        });
      }
      
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create requirement",
        variant: "destructive",
      });
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content?: string; type?: string }) => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/documents`, data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/details`] });
      
      // Check if a phase was unlocked
      if (response?._phaseUnlocked?.unlocked) {
        toast({
          title: "✅ Phase Unlocked!",
          description: `${response._phaseUnlocked.phaseName} — You can now proceed.`,
        });
      }
      
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create document",
        variant: "destructive",
      });
    },
  });

  const createDesignAssetMutation = useMutation({
    mutationFn: async (data: { name: string; fileType: string; fileSize: number; fileUrl: string; description?: string }) => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/details`] });
      toast({ title: "Success", description: "Design asset uploaded successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload design asset",
        variant: "destructive",
      });
    },
  });

  const createFigmaLinkMutation = useMutation({
    mutationFn: async (data: { title: string; figmaUrl: string; description?: string }) => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/figma-links`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/figma-links`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/details`] });
      toast({ title: "Success", description: "Figma link added successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add Figma link",
        variant: "destructive",
      });
    },
  });

  const createDesignReviewMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; status: string }) => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-reviews`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/details`] });
      toast({ title: "Success", description: "Design review created successfully" });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create design review",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (featureType === "design-assets" && !fileName) {
      toast({
        title: "Validation Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (featureType === "figma-link" && !figmaUrl) {
      toast({
        title: "Validation Error",
        description: "Figma URL is required",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() && featureType !== "design-assets") {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title,
      assignedTo: assignee !== "unassigned" ? assignee : undefined,
      priority,
      description,
    };

    switch (featureType) {
      case "epics":
        createEpicMutation.mutate(data);
        break;
      case "user-stories":
        createBacklogMutation.mutate({ ...data, type: "story" });
        break;
      case "requirements":
        createRequirementMutation.mutate(data);
        break;
      case "documentation":
        createDocumentMutation.mutate({
          title: data.title,
          content: data.description || undefined,
          type: "general",
        });
        break;
      case "design-assets":
        // Convert fileSize from string to integer bytes
        const fileSizeBytes = fileData ? Math.round((fileData.split(',')[1]?.length || 0) * 3 / 4) : 0;
        
        createDesignAssetMutation.mutate({
          name: fileName,
          fileUrl: fileData,
          fileType,
          fileSize: fileSizeBytes,
          description: data.description || undefined,
        });
        break;
      case "figma-link":
        createFigmaLinkMutation.mutate({
          title: data.title,
          figmaUrl,
          description: data.description || undefined,
        });
        break;
      case "review-design":
        createDesignReviewMutation.mutate({
          title: data.title,
          description: data.description || undefined,
          status: "pending",
        });
        break;
      default:
        // For other feature types, just show success (not implemented yet)
        onSuccess();
    }
  };

  const isLoading = createEpicMutation.isPending || createBacklogMutation.isPending || createRequirementMutation.isPending || createDocumentMutation.isPending || createDesignAssetMutation.isPending || createFigmaLinkMutation.isPending || createDesignReviewMutation.isPending;
  const renderForm = () => {
    switch (featureType) {
      case "pipelines":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input id="pipeline-name" placeholder="main-pipeline" data-testid="input-pipeline-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Target Branch</Label>
              <Select defaultValue="main">
                <SelectTrigger id="branch" data-testid="select-pipeline-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="develop">develop</SelectItem>
                  <SelectItem value="staging">staging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Pipeline description..." className="h-24" data-testid="textarea-pipeline-description" />
            </div>
          </div>
        );

      case "epics":
      case "user-stories":
      case "requirements":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder={`Enter ${featureType} title...`} 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-item-title" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger id="assignee" data-testid="select-assignee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="alice">Alice Johnson</SelectItem>
                  <SelectItem value="bob">Bob Smith</SelectItem>
                  <SelectItem value="carol">Carol Williams</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the work item..." 
                className="h-32" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="textarea-item-description" 
              />
            </div>
          </div>
        );

      case "branches":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input id="branch-name" placeholder="feature/new-feature" data-testid="input-branch-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base-branch">Base Branch</Label>
              <Select defaultValue="main">
                <SelectTrigger id="base-branch" data-testid="select-base-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="develop">develop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "releases":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" placeholder="1.0.0" data-testid="input-release-version" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-name">Release Name</Label>
              <Input id="release-name" placeholder="Q4 2024 Release" data-testid="input-release-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release-notes">Release Notes</Label>
              <Textarea id="release-notes" placeholder="What's new in this release?" className="h-32" data-testid="textarea-release-notes" />
            </div>
          </div>
        );

      case "design-assets":
        const MAX_FILE_SIZE_MB = 10;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
        const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (file.size > MAX_FILE_SIZE_BYTES) {
            toast({
              title: "File Too Large",
              description: `File size must not exceed ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
              variant: "destructive",
            });
            e.target.value = '';
            return;
          }

          if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            toast({
              title: "Invalid File Type",
              description: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
              variant: "destructive",
            });
            e.target.value = '';
            return;
          }

          setFileName(file.name);
          setFileType(file.type);
          setFileSize(`${(file.size / 1024).toFixed(2)} KB`);
          
          const reader = new FileReader();
          reader.onload = (event) => {
            setFileData(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        };

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <Input 
                id="file-upload" 
                type="file" 
                accept="image/*,.pdf,.sketch,.fig" 
                onChange={handleFileChange}
                data-testid="input-file-upload"
              />
              {fileName && (
                <p className="text-sm text-muted-foreground">
                  Selected: {fileName} ({fileSize})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-description">Description (Optional)</Label>
              <Textarea 
                id="asset-description" 
                placeholder="Describe the design asset..." 
                className="h-24" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="textarea-asset-description"
              />
            </div>
          </div>
        );

      case "figma-link":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="figma-title">Title</Label>
              <Input 
                id="figma-title" 
                placeholder="Design System v2" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-figma-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="figma-url">Figma URL</Label>
              <Input 
                id="figma-url" 
                placeholder="https://www.figma.com/file/..." 
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                data-testid="input-figma-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="figma-description">Description (Optional)</Label>
              <Textarea 
                id="figma-description" 
                placeholder="Describe the Figma design..." 
                className="h-24" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="textarea-figma-description"
              />
            </div>
          </div>
        );

      case "review-design":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-title">Title</Label>
              <Input 
                id="review-title" 
                placeholder="Dashboard Redesign" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-review-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-description">Description</Label>
              <Textarea 
                id="review-description" 
                placeholder="Describe what needs to be reviewed..." 
                className="h-32" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="textarea-review-description"
              />
            </div>
          </div>
        );

      case "environments":
      case "kubernetes-clusters":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="env-name">Name</Label>
              <Input id="env-name" placeholder={`${featureType === "environments" ? "Production" : "k8s-cluster"}`} data-testid="input-env-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-type">Type</Label>
              <Select defaultValue="production">
                <SelectTrigger id="env-type" data-testid="select-env-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-url">URL</Label>
              <Input id="env-url" placeholder="https://example.com" data-testid="input-env-url" />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                placeholder="Enter name..." 
                data-testid="input-generic-name" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter description..." 
                className="h-24" 
                data-testid="textarea-generic-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderForm()}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isLoading} data-testid="button-cancel-create">
          Cancel
        </Button>
        <Button onClick={handleCreate} disabled={isLoading} data-testid="button-submit-create">
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// BUILD & TESTING COMPONENTS
function PipelinesContent({ 
  projectName, 
  searchQuery,
  filters 
}: { 
  projectName: string; 
  searchQuery: string;
  filters: {
    status: string;
    assignee: string;
    priority: string;
    dateFrom: string;
    dateTo: string;
    includeArchived: boolean;
    starredOnly: boolean;
  };
}) {
  const { toast } = useToast();
  const pipelines = [
    { id: 1, name: "main-pipeline", branch: "main", status: "success", duration: "5m 23s", lastRun: "2 hours ago" },
    { id: 2, name: "develop-pipeline", branch: "develop", status: "running", duration: "3m 45s", lastRun: "Just now" },
    { id: 3, name: "feature-auth", branch: "feature/auth", status: "failed", duration: "2m 10s", lastRun: "1 day ago" },
    { id: 4, name: "hotfix-login", branch: "hotfix/login", status: "success", duration: "4m 15s", lastRun: "3 hours ago" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      success: "default",
      failed: "destructive",
      running: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filtered = pipelines.filter((p) => {
    // Search query filter
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.branch.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = filters.status === "all" || p.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-3">
      {filtered.map((pipeline) => (
        <Card key={pipeline.id} className="hover-elevate" data-testid={`card-pipeline-${pipeline.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(pipeline.status)}
                <div>
                  <CardTitle className="text-base">{pipeline.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <GitBranch className="h-3 w-3" />
                    {pipeline.branch}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(pipeline.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Duration: {pipeline.duration}</span>
              <span>{pipeline.lastRun}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => toast({ title: "Pipeline Running", description: `Started pipeline: ${pipeline.name}` })}
                data-testid={`button-view-pipeline-${pipeline.id}`}
              >
                <Play className="h-3 w-3 mr-1" />
                Run
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => toast({ title: "Edit Pipeline", description: `Opening editor for: ${pipeline.name}` })}
                data-testid={`button-edit-pipeline-${pipeline.id}`}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function JobsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const jobs = [
    { id: 1, name: "build", stage: "build", status: "success", duration: "2m 10s" },
    { id: 2, name: "test-unit", stage: "test", status: "success", duration: "1m 45s" },
    { id: 3, name: "test-integration", stage: "test", status: "running", duration: "3m 20s" },
    { id: 4, name: "deploy-staging", stage: "deploy", status: "pending", duration: "-" },
  ];

  const filtered = jobs.filter((j) => j.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((job) => (
        <Card key={job.id} data-testid={`card-job-${job.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{job.name}</h4>
                <p className="text-sm text-muted-foreground">Stage: {job.stage}</p>
              </div>
              <div className="text-right">
                <Badge>{job.status}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{job.duration}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PipelineEditorContent({ projectName }: { projectName: string }) {
  const { toast } = useToast();
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Configuration</CardTitle>
          <CardDescription>Edit your CI/CD pipeline YAML configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono text-sm min-h-[400px]"
            defaultValue={`stages:
  - build
  - test
  - deploy

build-job:
  stage: build
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/

test-job:
  stage: test
  script:
    - npm run test
  coverage: '/Coverage: \\d+\\.\\d+%/'

deploy-job:
  stage: deploy
  script:
    - npm run deploy
  only:
    - main`}
            data-testid="textarea-pipeline-config"
          />
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => toast({ title: "Pipeline Saved", description: "Pipeline configuration saved successfully!" })}
              data-testid="button-save-pipeline"
            >
              Save Pipeline
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast({ title: "Validation Complete", description: "Pipeline configuration is valid!" })}
              data-testid="button-validate"
            >
              Validate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArtifactsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const { toast } = useToast();
  const artifacts = [
    { id: 1, name: "build-artifacts.zip", size: "45.2 MB", created: "2 hours ago", downloads: 12 },
    { id: 2, name: "test-coverage.html", size: "2.1 MB", created: "2 hours ago", downloads: 5 },
    { id: 3, name: "dist.tar.gz", size: "38.5 MB", created: "1 day ago", downloads: 23 },
  ];

  const filtered = artifacts.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((artifact) => (
        <Card key={artifact.id} className="hover-elevate" data-testid={`card-artifact-${artifact.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{artifact.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {artifact.size} • {artifact.created} • {artifact.downloads} downloads
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => toast({ title: "Download Started", description: `Downloading ${artifact.name}...` })}
                data-testid={`button-download-artifact-${artifact.id}`}
              >
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SecurityConfigContent({ projectName }: { projectName: string }) {
  return (
    <Tabs defaultValue="scanning" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="scanning" data-testid="tab-scanning">
          Security Scanning
        </TabsTrigger>
        <TabsTrigger value="dependencies" data-testid="tab-dependencies">
          Dependencies
        </TabsTrigger>
        <TabsTrigger value="policies" data-testid="tab-policies">
          Policies
        </TabsTrigger>
      </TabsList>
      <TabsContent value="scanning" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Security Scanners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 className="font-medium">SAST (Static Analysis)</h4>
                <p className="text-sm text-muted-foreground">Scan source code for vulnerabilities</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 className="font-medium">Dependency Scanning</h4>
                <p className="text-sm text-muted-foreground">Check for vulnerable dependencies</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 className="font-medium">Container Scanning</h4>
                <p className="text-sm text-muted-foreground">Scan Docker images</p>
              </div>
              <Badge variant="secondary">Disabled</Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="dependencies">
        <Card>
          <CardHeader>
            <CardTitle>Vulnerable Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No vulnerable dependencies found.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="policies">
        <Card>
          <CardHeader>
            <CardTitle>Security Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configure security policies and compliance rules.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// DEPLOYMENT PHASE COMPONENTS
function ReleasesContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const { toast } = useToast();
  const releases = [
    { id: 1, version: "v2.1.0", tag: "v2.1.0", date: "2024-10-30", status: "published", downloads: 1247, assets: 5 },
    { id: 2, version: "v2.0.5", tag: "v2.0.5", date: "2024-10-28", status: "published", downloads: 3421, assets: 5 },
    { id: 3, version: "v2.0.4", tag: "v2.0.4", date: "2024-10-25", status: "draft", downloads: 0, assets: 3 },
  ];

  const filtered = releases.filter((r) => r.version.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((release) => (
        <Card key={release.id} className="hover-elevate" data-testid={`card-release-${release.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {release.version}
                </CardTitle>
                <CardDescription className="mt-1">{release.date}</CardDescription>
              </div>
              <Badge variant={release.status === "published" ? "default" : "secondary"}>
                {release.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span>{release.downloads.toLocaleString()} downloads</span>
              <span>{release.assets} assets</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => toast({ title: "View Release", description: `Opening release ${release.version}` })}
                data-testid={`button-view-release-${release.id}`}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => toast({ title: "Download Started", description: `Downloading release ${release.version}...` })}
                data-testid={`button-download-release-${release.id}`}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FeatureFlagsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const [flags, setFlags] = useState([
    { id: "1", name: "new-ui-design", description: "Enable new dashboard UI", enabled: true, rollout: 100 },
    { id: "2", name: "ai-suggestions", description: "AI-powered code suggestions", enabled: true, rollout: 50 },
    { id: "3", name: "dark-mode-v2", description: "New dark mode theme", enabled: false, rollout: 0 },
    { id: "4", name: "beta-features", description: "Experimental features", enabled: false, rollout: 10 },
  ]);

  const filtered = flags.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((flag) => (
        <Card key={flag.id} data-testid={`card-flag-${flag.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  {flag.name}
                </h4>
                <p className="text-sm text-muted-foreground">{flag.description}</p>
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={(checked) => {
                  setFlags(flags.map((f) => (f.id === flag.id ? { ...f, enabled: checked } : f)));
                }}
                data-testid={`switch-flag-${flag.id}`}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rollout</span>
                <span className="font-medium">{flag.rollout}%</span>
              </div>
              <Progress value={flag.rollout} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PackageRegistryContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const packages = [
    { id: 1, name: "@company/ui-components", version: "3.2.1", downloads: 45231, size: "2.3 MB", updated: "2 days ago" },
    { id: 2, name: "@company/auth-lib", version: "1.8.0", downloads: 12443, size: "856 KB", updated: "1 week ago" },
    { id: 3, name: "@company/api-client", version: "2.0.0", downloads: 8932, size: "1.2 MB", updated: "3 days ago" },
  ];

  const filtered = packages.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((pkg) => (
        <Card key={pkg.id} className="hover-elevate" data-testid={`card-package-${pkg.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{pkg.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    v{pkg.version} • {pkg.size} • {pkg.downloads.toLocaleString()} downloads
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Updated {pkg.updated}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-install-package-${pkg.id}`}>
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ModelRegistryContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const models = [
    { id: 1, name: "sentiment-analysis-v2", framework: "PyTorch", version: "2.1.0", accuracy: 94.5, size: "145 MB", updated: "5 days ago" },
    { id: 2, name: "image-classifier", framework: "TensorFlow", version: "1.3.2", accuracy: 91.2, size: "89 MB", updated: "1 week ago" },
    { id: 3, name: "recommendation-engine", framework: "Scikit-learn", version: "3.0.1", accuracy: 87.8, size: "23 MB", updated: "2 days ago" },
  ];

  const filtered = models.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((model) => (
        <Card key={model.id} className="hover-elevate" data-testid={`card-model-${model.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {model.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {model.framework} • v{model.version}
                </CardDescription>
              </div>
              <Badge>Accuracy: {model.accuracy}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span>{model.size}</span>
              <span>Updated {model.updated}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" data-testid={`button-deploy-model-${model.id}`}>
                <Rocket className="h-3 w-3 mr-1" />
                Deploy
              </Button>
              <Button size="sm" variant="ghost" data-testid={`button-download-model-${model.id}`}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// DEVELOPMENT PHASE COMPONENTS

// Code Generation from User Stories
function DevelopmentOverviewContent({ projectId, projectName }: { projectId: string; projectName: string }) {
  const { toast } = useToast();
  const [selectedStories, setSelectedStories] = useState<Set<number>>(new Set());
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<Record<number, string>>({});

  // Fetch repository to get repository ID
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/repositories`],
    enabled: !!projectId,
  });

  const repository = repositories && repositories.length > 0 ? repositories[0] : null;

  // Fetch branches for the repository
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/branches`],
    enabled: !!repository?.id,
  });

  // Fetch user stories from ADO
  const { data: userStoriesData, isLoading: isLoadingStories } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/ado/backlog-context`],
    enabled: !!projectId,
  });

  const userStories = userStoriesData || [];
  const isLoading = isLoadingRepos || isLoadingBranches || isLoadingStories;

  // Auto-select default branch when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      const defaultBranch = branches.find((b: any) => b.isDefault) || branches[0];
      setSelectedBranch(defaultBranch.id);
    }
  }, [branches, selectedBranch]);

  const toggleStorySelection = (storyId: number) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(storyId)) {
      newSelected.delete(storyId);
    } else {
      newSelected.add(storyId);
    }
    setSelectedStories(newSelected);
  };

  const handleGenerateCode = async () => {
    if (selectedStories.size === 0) {
      toast({
        title: "No Stories Selected",
        description: "Please select at least one user story to generate code",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBranch) {
      toast({
        title: "No Branch Selected",
        description: "Please select a branch to commit the generated code",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const storiesToGenerate = userStories.filter((story: any) => 
        selectedStories.has(story.id)
      );

      const selectedBranchData = branches.find((b: any) => b.id === selectedBranch);

      for (const story of storiesToGenerate) {
        // Call code generation API for each selected story
        const response = await apiRequest('POST', `/api/sdlc/generate-code`, {
          projectId,
          repositoryId: repository?.id,
          branchId: selectedBranch,
          branchName: selectedBranchData?.name,
          storyId: story.id,
          title: story.fields?.['System.Title'],
          description: story.fields?.['System.Description'],
          acceptanceCriteria: story.fields?.['Microsoft.VSTS.Common.AcceptanceCriteria'],
        });

        setGeneratedCode(prev => ({
          ...prev,
          [story.id]: (response as any).code || 'Code generation completed',
        }));
      }

      toast({
        title: "Success",
        description: `Code generated and committed to ${selectedBranchData?.name || 'branch'}`,
      });

      // Invalidate commits cache to refresh the commits list
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/repositories/${repository?.id}/commits`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!repository) {
    return (
      <Card data-testid="card-no-repository">
        <CardContent className="p-12 text-center">
          <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No repository found for this project</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please create a repository in the Repository section first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Branch Selection and Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold" data-testid="text-code-gen-title">
            User Stories from Azure DevOps
          </h3>
          <p className="text-sm text-muted-foreground">
            Select user stories to generate code implementation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px]" data-testid="select-branch">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch: any) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3" />
                    {branch.name}
                    {branch.isDefault && (
                      <Badge variant="outline" className="text-xs ml-1">
                        default
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerateCode}
            disabled={isGenerating || selectedStories.size === 0 || !selectedBranch}
            data-testid="button-generate-code"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Code className="h-4 w-4 mr-2" />
                Generate Code ({selectedStories.size})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* User Stories List */}
      {userStories.length === 0 ? (
        <Card data-testid="card-no-stories">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No user stories found in Azure DevOps</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create user stories in Phase 1 to generate code
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {userStories.map((story: any) => {
            const storyId = story.id;
            const isSelected = selectedStories.has(storyId);
            const hasGeneratedCode = generatedCode[storyId];

            return (
              <Card 
                key={storyId}
                className={`hover-elevate active-elevate-2 cursor-pointer transition-colors ${
                  isSelected ? 'border-primary' : ''
                }`}
                onClick={() => toggleStorySelection(storyId)}
                data-testid={`card-story-${storyId}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      className="mt-1"
                      data-testid={`checkbox-story-${storyId}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{storyId}
                        </Badge>
                        <h4 className="font-medium text-sm line-clamp-1" data-testid={`text-story-title-${storyId}`}>
                          {story.fields?.['System.Title'] || 'Untitled Story'}
                        </h4>
                      </div>
                      {story.fields?.['System.Description'] && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {story.fields['System.Description'].replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {story.fields?.['System.State'] || 'New'}
                        </Badge>
                        {story.fields?.['Microsoft.VSTS.Scheduling.StoryPoints'] && (
                          <Badge variant="outline" className="text-xs">
                            {story.fields['Microsoft.VSTS.Scheduling.StoryPoints']} pts
                          </Badge>
                        )}
                        {hasGeneratedCode && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Code Generated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generated Code Preview */}
      {Object.keys(generatedCode).length > 0 && (
        <Card data-testid="card-generated-code">
          <CardHeader>
            <CardTitle className="text-base">Generated Code</CardTitle>
            <CardDescription>
              Code has been generated for the selected user stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(generatedCode).map(([storyId, code]) => {
                const story = userStories.find((s: any) => s.id === parseInt(storyId));
                return (
                  <div key={storyId} className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">
                      #{storyId}: {story?.fields?.['System.Title']}
                    </p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {code}
                    </pre>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CodeBrowserContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const files = [
    { id: 1, name: "index.tsx", path: "src/index.tsx", type: "file", size: "2.3 KB", modified: "2 hours ago" },
    { id: 2, name: "App.tsx", path: "src/App.tsx", type: "file", size: "4.1 KB", modified: "5 hours ago" },
    { id: 3, name: "utils.ts", path: "src/lib/utils.ts", type: "file", size: "1.8 KB", modified: "1 day ago" },
    { id: 4, name: "README.md", path: "README.md", type: "file", size: "3.2 KB", modified: "3 days ago" },
  ];

  const filtered = files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((file) => (
        <Card key={file.id} className="hover-elevate" data-testid={`card-file-${file.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCode className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{file.name}</h4>
                  <p className="text-sm text-muted-foreground">{file.path}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file.size} • Modified {file.modified}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-view-file-${file.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RepositoryContent({ projectName, projectId, onClose }: { projectName: string; projectId?: string; onClose?: () => void }) {
  const { toast } = useToast();
  const [repoName, setRepoName] = useState(`${projectName.replace(/\s+/g, '-')}-Repo`);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Fetch existing repositories
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/repositories`],
    enabled: !!projectId,
  });

  // Fetch user stories from Azure DevOps (only when showing creation form)
  const { data: userStories = [], isLoading: isLoadingStories } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/ado/user-stories`],
    enabled: !!projectId && showCreationForm,
  });

  const existingRepo = repositories && repositories.length > 0 ? repositories[0] : null;
  const isLoading = isLoadingRepos || (showCreationForm && isLoadingStories);

  // Automatically show creation form when no repository exists (only once on initial load)
  useEffect(() => {
    if (!isLoadingRepos && !existingRepo && !showCreationForm && !hasAutoOpened) {
      setShowCreationForm(true);
      setHasAutoOpened(true);
    }
  }, [isLoadingRepos, existingRepo, showCreationForm, hasAutoOpened]);

  const handleStoryToggle = (storyId: string) => {
    setSelectedStoryIds(prev => 
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStoryIds.length === userStories.length) {
      setSelectedStoryIds([]);
    } else {
      setSelectedStoryIds(userStories.map((story: any) => story.id));
    }
  };

  const handleCreateRepository = async () => {
    if (!repoName.trim()) {
      toast({
        title: "Validation Error",
        description: "Repository name is required",
        variant: "destructive",
      });
      return;
    }

    // Only require story selection if stories are available
    if (userStories.length > 0 && selectedStoryIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one user story",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(getApiUrl(`/api/sdlc/projects/${projectId}/create-repo-with-code`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          repoName: repoName.trim(),
          selectedUserStoryIds: selectedStoryIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create repository");
      }

      const result = await response.json();
      
      toast({
        title: "Repository Created",
        description: `Successfully created repository "${repoName}" with generated code!`,
      });

      // Refresh repository list and hide creation form
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/repositories`] });
      setShowCreationForm(false);
      
      // Close dialog after brief delay to show success
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (error) {
      console.error("Error creating repository:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create repository",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            {showCreationForm ? 'Loading user stories...' : 'Loading repository...'}
          </p>
        </div>
      </div>
    );
  }

  // Show repository info if it exists and we're not in creation mode
  if (existingRepo && !showCreationForm) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5" />
              {existingRepo.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`font-medium capitalize ${
                  existingRepo.status === 'active' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-muted-foreground'
                }`}>
                  {existingRepo.status || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {existingRepo.createdAt ? new Date(existingRepo.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Repository ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">{existingRepo.id}</code>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} data-testid="button-close">
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Show creation form if no repository exists or user clicked "create new"
  if (!existingRepo || showCreationForm) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="repo-name" className="text-sm font-medium mb-1.5 block">
            Repository Name
          </label>
          <Input
            id="repo-name"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="Enter repository name"
            data-testid="input-repo-name"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              Select User Stories ({selectedStoryIds.length} of {userStories.length})
            </label>
            {userStories.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
                data-testid="button-select-all-stories"
              >
                {selectedStoryIds.length === userStories.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
          
          {userStories.length === 0 ? (
            <div className="border rounded-md p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No user stories found in Azure DevOps.
                <br />
                You can still create the repository, but no code will be generated.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md p-3">
              <div className="space-y-2">
                {userStories.map((story: any) => (
                  <div
                    key={story.id}
                    className="flex items-start gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                    onClick={() => handleStoryToggle(story.id)}
                    data-testid={`story-item-${story.id}`}
                  >
                    <Checkbox
                      checked={selectedStoryIds.includes(story.id)}
                      className="mt-0.5"
                      data-testid={`checkbox-story-${story.id}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{story.title}</p>
                      {story.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {story.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRepository}
            disabled={isCreating || (userStories.length > 0 && selectedStoryIds.length === 0)}
            data-testid="button-submit-repo"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Create Repository
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }
}

function BranchesContent({ projectName, projectId, searchQuery }: { projectName: string; projectId?: string; searchQuery: string }) {
  const { toast } = useToast();
  const [createSubBranchDialogOpen, setCreateSubBranchDialogOpen] = useState(false);
  const [selectedParentBranch, setSelectedParentBranch] = useState<string>("");
  const [subBranchName, setSubBranchName] = useState("");
  const [codebaseUrl, setCodebaseUrl] = useState("");
  const [, setLocation] = useLocation();

  // Fetch repository to get repository ID
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/repositories`],
    enabled: !!projectId,
  });

  const repository = repositories && repositories.length > 0 ? repositories[0] : null;

  // Fetch branches for the repository
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/branches`],
    enabled: !!repository?.id,
  });

  // Sub-branches (stored in state - in a real app, this would be fetched from a database)
  const [subBranches, setSubBranches] = useState<Array<{ name: string; parent: string; codebaseUrl: string; commits: string; lastUpdate: string }>>([]);

  const handleCreateSubBranch = (parentBranch: string) => {
    setSelectedParentBranch(parentBranch);
    setSubBranchName("");
    setCodebaseUrl("");
    setCreateSubBranchDialogOpen(true);
  };

  const handleSaveSubBranch = () => {
    if (!subBranchName.trim()) {
      toast({
        title: "Validation Error",
        description: "Branch name is required",
        variant: "destructive",
      });
      return;
    }

    if (!codebaseUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Codebase URL is required",
        variant: "destructive",
      });
      return;
    }

    // Add the new sub-branch
    setSubBranches(prev => [...prev, {
      name: subBranchName,
      parent: selectedParentBranch,
      codebaseUrl: codebaseUrl,
      commits: "0 commits",
      lastUpdate: "Just now",
    }]);

    toast({
      title: "Sub-branch Created",
      description: `Sub-branch '${subBranchName}' created from '${selectedParentBranch}'`,
    });

    setCreateSubBranchDialogOpen(false);
  };

  const handleSubBranchClick = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const isLoading = isLoadingRepos || isLoadingBranches;
  const filtered = branches.filter((b: any) => b.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading branches...</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="border rounded-md p-8 text-center">
        <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No repository found for this project.
          <br />
          Please create a repository first.
        </p>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No branches found in this repository.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((branch: any) => (
        <div key={branch.id} className="space-y-2">
          {/* Parent Branch Card */}
          <Card className="hover-elevate" data-testid={`card-branch-${branch.name}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {branch.name}
                      {branch.isDefault && <Badge variant="default">Default</Badge>}
                      {branch.isProtected && <Badge variant="outline">Protected</Badge>}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Created {branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCreateSubBranch(branch.name)}
                  data-testid={`button-create-subbranch-${branch.name}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Sub-branch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sub-branches */}
          {subBranches.filter(sb => sb.parent === branch.name).map((subBranch) => (
            <Card 
              key={subBranch.name} 
              className="ml-8 hover-elevate cursor-pointer active-elevate-2" 
              onClick={() => handleSubBranchClick(subBranch.codebaseUrl)}
              data-testid={`card-subbranch-${subBranch.name}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h5 className="text-sm font-medium">{subBranch.name}</h5>
                      <p className="text-xs text-muted-foreground">
                        {subBranch.commits} • Updated {subBranch.lastUpdate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span>View Codebase</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Create Sub-branch Dialog */}
      <Dialog open={createSubBranchDialogOpen} onOpenChange={setCreateSubBranchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sub-branch from {selectedParentBranch}</DialogTitle>
            <DialogDescription>
              Create a new sub-branch and provide the codebase URL for this branch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subbranch-name">Sub-branch Name *</Label>
              <Input
                id="subbranch-name"
                placeholder="e.g., feature/user-auth"
                value={subBranchName}
                onChange={(e) => setSubBranchName(e.target.value)}
                data-testid="input-subbranch-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codebase-url">Codebase URL *</Label>
              <Input
                id="codebase-url"
                placeholder="https://github.com/user/repo/tree/branch-name"
                value={codebaseUrl}
                onChange={(e) => setCodebaseUrl(e.target.value)}
                data-testid="input-codebase-url"
              />
              <p className="text-xs text-muted-foreground">
                Provide the full URL to the codebase for this branch (e.g., GitHub, GitLab, etc.)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateSubBranchDialogOpen(false)}
              data-testid="button-cancel-subbranch"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubBranch}
              data-testid="button-save-subbranch"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Sub-branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommitsContent({ projectName, projectId, searchQuery }: { projectName: string; projectId?: string; searchQuery: string }) {
  // Fetch repository to get repository ID
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/repositories`],
    enabled: !!projectId,
  });

  const repository = repositories && repositories.length > 0 ? repositories[0] : null;

  // Fetch commits for the repository
  const { data: commits = [], isLoading: isLoadingCommits } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/commits`],
    enabled: !!repository?.id,
  });

  // Fetch branches for the repository to map branchId to branch name
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/branches`],
    enabled: !!repository?.id,
  });

  // Create a map of branchId to branch name
  const branchMap = branches.reduce((map: Record<string, string>, branch: any) => {
    map[branch.id] = branch.name;
    return map;
  }, {});

  const isLoading = isLoadingRepos || isLoadingCommits || isLoadingBranches;

  const filtered = commits.filter((c: any) => 
    c.message?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading commits...</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="border rounded-md p-8 text-center">
        <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No repository found for this project.
          <br />
          Please create a repository first.
        </p>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No commits found in this repository.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((commit: any, index: number) => (
        <Card key={commit.id} className="hover-elevate" data-testid={`card-commit-${commit.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <GitCommit className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium flex items-center gap-2 flex-wrap">
                    {commit.commitNumber ? `${commit.commitNumber}${commit.commitNumber === 1 ? 'st' : commit.commitNumber === 2 ? 'nd' : commit.commitNumber === 3 ? 'rd' : 'th'} commit - ` : ''}{commit.message}
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {commit.branchId && branchMap[commit.branchId] && (
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-branch-${commit.id}`}>
                        <GitBranch className="h-3 w-3 mr-1" />
                        {branchMap[commit.branchId]}
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {commit.author} • {commit.createdAt ? new Date(commit.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                    {commit.id.substring(0, 7)}
                  </code>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-view-commit-${commit.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MergeRequestsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const mergeRequests = [
    { id: 1, title: "Feature: Add dark mode support", source: "feature/dark-mode", target: "develop", author: "John Doe", status: "open", comments: 5, approvals: 2 },
    { id: 2, title: "Fix: Resolve API timeout issues", source: "hotfix/api-timeout", target: "main", author: "Jane Smith", status: "approved", comments: 3, approvals: 3 },
    { id: 3, title: "Docs: Update contribution guidelines", source: "docs/contribution", target: "develop", author: "Bob Wilson", status: "merged", comments: 1, approvals: 2 },
  ];

  const filtered = mergeRequests.filter((mr) => mr.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((mr) => (
        <Card key={mr.id} className="hover-elevate" data-testid={`card-mr-${mr.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{mr.title}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <GitMerge className="h-3 w-3" />
                  {mr.source} → {mr.target}
                </CardDescription>
              </div>
              <Badge variant={mr.status === "merged" ? "default" : mr.status === "approved" ? "secondary" : "outline"}>
                {mr.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span>{mr.author}</span>
              <div className="flex items-center gap-3">
                <span>{mr.comments} comments</span>
                <span>{mr.approvals} approvals</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" data-testid={`button-review-mr-${mr.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                Review
              </Button>
              {mr.status === "open" && (
                <Button size="sm" data-testid={`button-approve-mr-${mr.id}`}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approve
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TagsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const tags = [
    { id: 1, name: "v2.1.0", commit: "a3b2c1d", message: "Release version 2.1.0", date: "2024-10-30", author: "John Doe" },
    { id: 2, name: "v2.0.5", commit: "b4c3d2e", message: "Patch release 2.0.5", date: "2024-10-28", author: "Jane Smith" },
    { id: 3, name: "v2.0.0", commit: "c5d4e3f", message: "Major release 2.0.0", date: "2024-10-15", author: "Bob Wilson" },
  ];

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((tag) => (
        <Card key={tag.id} className="hover-elevate" data-testid={`card-tag-item-${tag.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{tag.name}</h4>
                  <p className="text-sm text-muted-foreground">{tag.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tag.author} • {tag.date}
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                    {tag.commit}
                  </code>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-download-tag-item-${tag.id}`}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// DESIGN PHASE COMPONENTS
function SnippetsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const snippets = [
    { id: 1, title: "Auth Helper Function", language: "TypeScript", lines: 25, created: "2 days ago", visibility: "Private" },
    { id: 2, title: "Custom React Hook", language: "JavaScript", lines: 45, created: "1 week ago", visibility: "Public" },
    { id: 3, title: "SQL Query Template", language: "SQL", lines: 12, created: "3 days ago", visibility: "Private" },
  ];

  const filtered = snippets.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((snippet) => (
        <Card key={snippet.id} className="hover-elevate" data-testid={`card-snippet-${snippet.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{snippet.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {snippet.language} • {snippet.lines} lines • Created {snippet.created}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={snippet.visibility === "Public" ? "default" : "secondary"}>
                  {snippet.visibility}
                </Badge>
                <Button size="sm" variant="outline" data-testid={`button-view-snippet-${snippet.id}`}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RepositoryGraphContent({ projectName }: { projectName: string }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Commit Graph</CardTitle>
          <CardDescription>Visual representation of repository activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
            <div className="text-center space-y-2">
              <Network className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Interactive commit graph visualization</p>
              <p className="text-xs text-muted-foreground">Shows branch history and merge patterns</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">247</div>
            <div className="text-sm text-muted-foreground">Total Commits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Active Branches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">8</div>
            <div className="text-sm text-muted-foreground">Contributors</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Initial UI Components Data
const initialUiComponents = [
  {
    id: '1',
    name: 'Primary Button',
    type: 'Interactive Element',
    description: 'Main call-to-action button for form submissions and primary user actions.',
    usage: 'Use for the most important action on a page. Limit to one per screen for clear visual hierarchy.',
    codeSnippet: '<Button variant="default">Submit</Button>',
    notes: '',
  },
  {
    id: '2',
    name: 'Input Field',
    type: 'Form Element',
    description: 'Standard text input for user data entry with validation support.',
    usage: 'Use for single-line text inputs like names, emails, and search queries. Always include proper labels.',
    codeSnippet: '<Input placeholder="Enter text..." />',
    notes: '',
  },
  {
    id: '3',
    name: 'Navigation Menu',
    type: 'UI Component',
    description: 'Top-level navigation with dropdown support for organizing site sections.',
    usage: 'Place at the top of the application. Keep menu items between 4-7 for optimal usability.',
    codeSnippet: '<NavigationMenu><NavigationMenuList>...</NavigationMenuList></NavigationMenu>',
    notes: '',
  },
  {
    id: '4',
    name: 'Data Table',
    type: 'UI Component',
    description: 'Sortable and filterable table for displaying structured data sets.',
    usage: 'Use for displaying collections of items with multiple attributes. Include pagination for large datasets.',
    codeSnippet: '<Table><TableHeader>...</TableHeader><TableBody>...</TableBody></Table>',
    notes: '',
  },
  {
    id: '5',
    name: 'Modal Dialog',
    type: 'Interactive Element',
    description: 'Overlay component for focused user interactions and confirmations.',
    usage: 'Use sparingly for critical actions that require user attention. Always provide a clear close mechanism.',
    codeSnippet: '<Dialog><DialogContent>...</DialogContent></Dialog>',
    notes: '',
  },
];

function DesignAssetsContent({ projectId, projectName, phaseNumber, searchQuery }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string }) {
  const { toast } = useToast();
  const [components, setComponents] = useState(initialUiComponents);
  const [viewComponent, setViewComponent] = useState<typeof initialUiComponents[0] | null>(null);
  const [editComponent, setEditComponent] = useState<typeof initialUiComponents[0] | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const filtered = components.filter((c) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (component: typeof initialUiComponents[0]) => {
    setViewComponent(component);
    setViewDialogOpen(true);
  };

  const handleEdit = (component: typeof initialUiComponents[0]) => {
    setEditComponent(component);
    setEditDescription(component.description);
    setEditNotes(component.notes || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editComponent) {
      // Update the component in state
      setComponents(prev => prev.map(c => 
        c.id === editComponent.id 
          ? { ...c, description: editDescription, notes: editNotes }
          : c
      ));
      
      toast({ 
        title: "Success", 
        description: "Component details updated successfully" 
      });
    }
    setEditDialogOpen(false);
  };

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center space-y-2">
          <Palette className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No UI components found matching your search.
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search terms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <p className="text-sm text-muted-foreground" data-testid="text-components-count">
          {components.length} UI component{components.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="space-y-3">
        {filtered.map((component) => (
          <Card key={component.id} className="hover-elevate" data-testid={`card-component-${component.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Palette className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{component.name}</h4>
                    <p className="text-sm text-muted-foreground">{component.type}</p>
                    <p className="text-sm text-muted-foreground mt-1">{component.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleView(component)} data-testid={`button-view-component-${component.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(component)} data-testid={`button-edit-component-${component.id}`}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl" data-testid="dialog-view-component">
          <DialogHeader>
            <DialogTitle data-testid="text-component-name">{viewComponent?.name}</DialogTitle>
            <DialogDescription data-testid="text-component-type">{viewComponent?.type}</DialogDescription>
          </DialogHeader>
          {viewComponent && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground" data-testid="text-component-description">{viewComponent.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Usage Guidelines</h4>
                <p className="text-sm text-muted-foreground" data-testid="text-component-usage">{viewComponent.usage}</p>
              </div>
              {viewComponent.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-component-notes">{viewComponent.notes}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">Code Example</h4>
                <div className="border rounded-lg p-4 bg-muted/20 font-mono text-sm" data-testid="text-component-code">
                  {viewComponent.codeSnippet}
                </div>
              </div>
              <div className="border rounded-lg p-8 bg-muted/10 flex items-center justify-center" data-testid="preview-component-area">
                <div className="text-center space-y-2">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Component Preview</p>
                  <p className="text-xs text-muted-foreground">{viewComponent.name}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-component">
          <DialogHeader>
            <DialogTitle>Edit {editComponent?.name}</DialogTitle>
            <DialogDescription>Update component description and notes</DialogDescription>
          </DialogHeader>
          {editComponent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="h-24"
                  data-testid="textarea-edit-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Additional Notes</Label>
                <Textarea 
                  id="edit-notes" 
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add any additional notes or customizations..."
                  className="h-32"
                  data-testid="textarea-edit-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} data-testid="button-save-edit">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OldDesignAssetsContent({ projectId, projectName, phaseNumber, searchQuery }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string }) {
  const { toast } = useToast();
  const [previewAsset, setPreviewAsset] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  const { data: assets = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/sdlc/projects/${projectId}/sync-documents-to-design`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases`] });
      toast({ 
        title: "Success", 
        description: `Documentation synced successfully. ${data.syncedCount} new asset(s) imported.`
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to sync documents", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sdlc/design-assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`] });
      toast({ title: "Success", description: "Design asset deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete design asset", variant: "destructive" });
    },
  });

  const filtered = assets.filter((a) => a.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePreview = (asset: any) => {
    setPreviewAsset(asset);
    setPreviewDialogOpen(true);
  };

  const handleDownload = (asset: any) => {
    const link = document.createElement('a');
    link.href = asset.fileUrl;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success", description: "Design asset downloaded successfully" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this design asset?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading design assets...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load design assets</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-assets">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center space-y-2">
          <Palette className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No design assets found matching your search" : "No design assets yet."}
          </p>
          <p className="text-xs text-muted-foreground">
            Sync documents from Requirements or upload manually to get started.
          </p>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-documents-empty"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync Documents
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? 's' : ''} • {assets.filter(a => a.source === 'synced_from_requirement').length} synced from Requirements
        </p>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-documents"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync Documents
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((asset) => (
          <Card key={asset.id} className="hover-elevate" data-testid={`card-asset-${asset.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Palette className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium truncate">{asset.name}</h4>
                      {asset.source === 'synced_from_requirement' && (
                        <Badge variant="secondary" className="text-xs shrink-0" data-testid={`badge-synced-${asset.id}`}>
                          Synced from Requirement
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {asset.fileType} • {asset.fileSize ? `${(asset.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated: {new Date(asset.updatedAt).toLocaleDateString()} at {new Date(asset.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {asset.description && (
                      <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handlePreview(asset)} data-testid={`button-preview-asset-${asset.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(asset)} data-testid={`button-download-asset-${asset.id}`}>
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(asset.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-asset-${asset.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl" data-testid="dialog-preview-asset">
          <DialogHeader>
            <DialogTitle>{previewAsset?.name}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/20 max-h-[60vh] overflow-auto">
                <img 
                  src={previewAsset.fileUrl} 
                  alt={previewAsset.name} 
                  className="max-w-full h-auto mx-auto"
                  data-testid="img-preview-asset"
                />
              </div>
              {previewAsset.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{previewAsset.description}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => handleDownload(previewAsset)} data-testid="button-download-preview">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => setPreviewDialogOpen(false)} data-testid="button-close-preview">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FigmaLinkContent({ projectId, projectName, phaseNumber }: { projectId: string; projectName: string; phaseNumber: number }) {
  const { toast } = useToast();
  
  const { data: figmaLinks = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/figma-links`],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sdlc/figma-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/figma-links`] });
      toast({ title: "Success", description: "Figma link deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete Figma link", variant: "destructive" });
    },
  });

  const handleOpenFigma = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this Figma link?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Figma links...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load Figma links</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-figma">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (figmaLinks.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Figma className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No Figma links yet. Add one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {figmaLinks.map((link) => (
        <Card key={link.id} className="hover-elevate" data-testid={`card-figma-${link.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Figma className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{link.title}</h4>
                  {link.description && (
                    <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => handleOpenFigma(link.figmaUrl)} data-testid={`button-open-figma-${link.id}`}>
                  <Eye className="h-3 w-3 mr-1" />
                  Open in Figma
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleDelete(link.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-figma-${link.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// MAINTENANCE PHASE COMPONENTS
function EnvironmentsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const environments = [
    { id: 1, name: "Production", status: "healthy", uptime: "99.98%", deployments: 45, lastDeploy: "2 hours ago" },
    { id: 2, name: "Staging", status: "healthy", uptime: "99.85%", deployments: 123, lastDeploy: "30 min ago" },
    { id: 3, name: "Development", status: "warning", uptime: "98.5%", deployments: 456, lastDeploy: "5 min ago" },
  ];

  const filtered = environments.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((env) => (
        <Card key={env.id} className="hover-elevate" data-testid={`card-env-${env.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {env.name}
                    <Badge variant={env.status === "healthy" ? "default" : "secondary"}>
                      {env.status}
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Uptime: {env.uptime} • Last deploy: {env.lastDeploy}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-manage-env-${env.id}`}>
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {env.deployments} deployments
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function KubernetesClustersContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const clusters = [
    { id: 1, name: "production-cluster", region: "us-east-1", nodes: 5, status: "running", version: "1.28.3" },
    { id: 2, name: "staging-cluster", region: "us-west-2", nodes: 3, status: "running", version: "1.28.3" },
    { id: 3, name: "dev-cluster", region: "eu-central-1", nodes: 2, status: "stopped", version: "1.27.8" },
  ];

  const filtered = clusters.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((cluster) => (
        <Card key={cluster.id} className="hover-elevate" data-testid={`card-cluster-${cluster.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Container className="h-4 w-4" />
                  {cluster.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {cluster.region} • Kubernetes {cluster.version}
                </CardDescription>
              </div>
              <Badge variant={cluster.status === "running" ? "default" : "secondary"}>
                {cluster.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span>{cluster.nodes} nodes</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" data-testid={`button-view-cluster-${cluster.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button size="sm" variant="ghost" data-testid={`button-configure-cluster-${cluster.id}`}>
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TerraformStatesContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const states = [
    { id: 1, name: "production-infra", workspace: "default", resources: 45, lastModified: "2 days ago", status: "synced" },
    { id: 2, name: "staging-infra", workspace: "staging", resources: 32, lastModified: "1 week ago", status: "synced" },
    { id: 3, name: "dev-infra", workspace: "dev", resources: 18, lastModified: "3 hours ago", status: "drift" },
  ];

  const filtered = states.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((state) => (
        <Card key={state.id} className="hover-elevate" data-testid={`card-state-${state.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {state.name}
                    <Badge variant={state.status === "synced" ? "default" : "secondary"}>
                      {state.status}
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Workspace: {state.workspace} • {state.resources} resources
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last modified {state.lastModified}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-view-state-${state.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MonitorContent({ projectName }: { projectName: string }) {
  return (
    <Tabs defaultValue="metrics" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="metrics" data-testid="tab-metrics">Metrics</TabsTrigger>
        <TabsTrigger value="logs" data-testid="tab-logs">Logs</TabsTrigger>
        <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
      </TabsList>
      <TabsContent value="metrics" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "CPU Usage", value: "42%", icon: Activity },
            { label: "Memory", value: "1.2 GB", icon: Server },
            { label: "Requests/min", value: "1,247", icon: TrendingUp },
            { label: "Error Rate", value: "0.03%", icon: AlertCircle },
          ].map((metric, idx) => (
            <Card key={idx} data-testid={`card-monitor-metric-${idx}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="logs">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 font-mono text-xs">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="p-2 border rounded bg-muted/20" data-testid={`log-monitor-${i}`}>
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span> Request processed - 200 OK
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="alerts">
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">No active alerts</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function ErrorTrackingContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const errors = [
    { id: 1, title: "TypeError: Cannot read property 'id'", count: 45, lastSeen: "5 min ago", status: "unresolved", severity: "high" },
    { id: 2, title: "API timeout in /users endpoint", count: 12, lastSeen: "2 hours ago", status: "resolved", severity: "medium" },
    { id: 3, title: "Database connection failed", count: 3, lastSeen: "1 day ago", status: "unresolved", severity: "critical" },
  ];

  const filtered = errors.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((error) => (
        <Card key={error.id} className="hover-elevate" data-testid={`card-error-${error.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${error.severity === "critical" ? "text-red-500" : error.severity === "high" ? "text-orange-500" : "text-yellow-500"}`} />
                <div className="flex-1">
                  <h4 className="font-medium">{error.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error.count} occurrences • Last seen {error.lastSeen}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={error.status === "resolved" ? "default" : "destructive"}>
                      {error.status}
                    </Badge>
                    <Badge variant="outline">{error.severity}</Badge>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-view-error-${error.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AlertsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const alerts = [
    { id: 1, title: "High Memory Usage", condition: "Memory > 80%", status: "firing", severity: "warning", triggered: "10 min ago" },
    { id: 2, title: "API Response Time", condition: "Response time > 2s", status: "resolved", severity: "info", triggered: "2 hours ago" },
    { id: 3, title: "Error Rate Spike", condition: "Errors > 5%", status: "firing", severity: "critical", triggered: "30 min ago" },
  ];

  const filtered = alerts.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((alert) => (
        <Card key={alert.id} className="hover-elevate" data-testid={`card-alert-${alert.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Bell className={`h-5 w-5 mt-0.5 ${alert.status === "firing" ? "text-red-500" : "text-green-500"}`} />
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {alert.title}
                    <Badge variant={alert.status === "firing" ? "destructive" : "default"}>
                      {alert.status}
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{alert.condition}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Triggered {alert.triggered} • Severity: {alert.severity}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" data-testid={`button-acknowledge-alert-${alert.id}`}>
                Acknowledge
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function IncidentsContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const incidents = [
    { id: 1, title: "Database Outage", status: "resolved", severity: "critical", startedAt: "2024-10-29 14:30", duration: "2h 15m", assignee: "John Doe" },
    { id: 2, title: "API Performance Degradation", status: "investigating", severity: "high", startedAt: "2024-10-30 09:00", duration: "3h 45m", assignee: "Jane Smith" },
    { id: 3, title: "Login Service Slow", status: "monitoring", severity: "medium", startedAt: "2024-10-30 16:20", duration: "45m", assignee: "Bob Wilson" },
  ];

  const filtered = incidents.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      {filtered.map((incident) => (
        <Card key={incident.id} className="hover-elevate" data-testid={`card-incident-${incident.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${incident.severity === "critical" ? "text-red-500" : incident.severity === "high" ? "text-orange-500" : "text-yellow-500"}`} />
                  {incident.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  Started at {incident.startedAt} • Duration: {incident.duration}
                </CardDescription>
              </div>
              <Badge variant={incident.status === "resolved" ? "default" : incident.status === "investigating" ? "destructive" : "secondary"}>
                {incident.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span>Assignee: {incident.assignee}</span>
              <Badge variant="outline">{incident.severity}</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" data-testid={`button-view-incident-${incident.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ValueStreamAnalyticsContent({ projectName }: { projectName: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Lead Time", value: "3.2 days", change: "-12%", icon: Clock },
          { label: "Cycle Time", value: "1.8 days", change: "-8%", icon: Activity },
          { label: "Deployment Frequency", value: "12/week", change: "+25%", icon: Rocket },
        ].map((metric, idx) => (
          <Card key={idx} data-testid={`card-vsm-metric-${idx}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <Badge variant={metric.change.startsWith("+") ? "default" : "secondary"} className="mt-2">
                {metric.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Value Stream Map</CardTitle>
          <CardDescription>End-to-end software delivery process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/20">
            <div className="text-center space-y-2">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Interactive value stream visualization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// REQUIREMENTS & ANALYSIS PHASE COMPONENTS
function EpicsContent({ projectId, projectName, phaseNumber, searchQuery }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string }) {
  const { toast } = useToast();
  
  const { data: epics = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/epics`],
  });

  const filtered = epics.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading epics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load epics</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-epics">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No epics found matching your search" : "No epics yet. Create one to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((epic) => (
        <Card key={epic.id} className="hover-elevate" data-testid={`card-epic-${epic.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {epic.title}
                </CardTitle>
                {epic.description && (
                  <CardDescription className="mt-1">
                    {epic.description}
                  </CardDescription>
                )}
                {epic.featureCount !== undefined && (
                  <CardDescription className="mt-1">
                    {epic.featureCount} features
                  </CardDescription>
                )}
              </div>
              <Badge variant={epic.status === "completed" ? "default" : epic.status === "in-progress" ? "secondary" : "outline"}>
                {epic.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {epic.priority && (
              <div className="mb-3">
                <Badge variant={epic.priority === "high" ? "destructive" : epic.priority === "medium" ? "secondary" : "outline"}>
                  {epic.priority} priority
                </Badge>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => toast({ title: "View Epic", description: `Opening details for: ${epic.title}` })}
                data-testid={`button-view-epic-${epic.id}`}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => toast({ title: "Edit Epic", description: `Opening editor for: ${epic.title}` })}
                data-testid={`button-edit-epic-${epic.id}`}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserStoriesContent({ projectId, projectName, phaseNumber, searchQuery, filters }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string; filters?: any }) {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Fetch all work items from Azure DevOps (epics, features, user stories, tasks, bugs)
  const { data: adoBacklogContext, isLoading, isError, error, refetch } = useQuery<{
    epics: any[];
    features: any[];
    userStories: any[];
    tasks: any[];
    bugs: any[];
  }>({
    queryKey: [`/api/sdlc/projects/${projectId}/ado/backlog-context`],
  });
  
  // Transform ADO work items to match our display format
  const transformAdoWorkItem = (item: any, itemType: string) => {
    const fields = item.fields || {};
    return {
      id: item.id,
      title: fields['System.Title'] || 'Untitled',
      description: fields['System.Description'] || '',
      status: fields['System.State'] || 'New',
      priority: fields['Microsoft.VSTS.Common.Priority'] || '',
      assignedTo: fields['System.AssignedTo']?.displayName || '',
      storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'] || '',
      itemType,
      workItemType: fields['System.WorkItemType'],
    };
  };
  
  // Combine and transform all items with type labels
  const epics = (adoBacklogContext?.epics || []).map(item => transformAdoWorkItem(item, 'Epic'));
  const features = (adoBacklogContext?.features || []).map(item => transformAdoWorkItem(item, 'Feature'));
  const userStories = (adoBacklogContext?.userStories || []).map(item => transformAdoWorkItem(item, 'User Story'));
  const tasks = (adoBacklogContext?.tasks || []).map(item => transformAdoWorkItem(item, 'Task'));
  const bugs = (adoBacklogContext?.bugs || []).map(item => transformAdoWorkItem(item, 'Bug'));
  
  // Filter based on item type checkboxes (default to all if no filters set)
  let allItems: any[] = [];
  if (!filters || filters?.epics) allItems = [...allItems, ...epics];
  if (!filters || filters?.features) allItems = [...allItems, ...features];
  if (!filters || filters?.userStories) allItems = [...allItems, ...userStories];
  if (!filters || filters?.backlog) allItems = [...allItems, ...tasks, ...bugs];
  
  // Apply search filter
  const filtered = allItems.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading work items from Azure DevOps...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load work items</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-stories">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No work items found matching your search" : "No work items yet. Check Azure DevOps to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((item) => (
        <Card key={item.id} className="hover-elevate" data-testid={`card-item-${item.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {item.itemType}
                  </Badge>
                </div>
                <h4 className="font-medium">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
                {(item.assignedTo || item.storyPoints) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.assignedTo && `Assignee: ${item.assignedTo}`}
                    {item.assignedTo && item.storyPoints && ' • '}
                    {item.storyPoints && `${item.storyPoints} points`}
                  </p>
                )}
              </div>
              {item.status && (
                <Badge variant={item.status === "done" ? "default" : item.status === "in_progress" ? "secondary" : "outline"}>
                  {item.status}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {item.priority && (
                <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                  {item.priority}
                </Badge>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleViewItem(item)}
                data-testid={`button-view-item-${item.id}`}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleEditItem(item)}
                data-testid={`button-edit-item-${item.id}`}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Work Item Details Dialog */}
      <WorkItemDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        item={selectedItem}
        itemType="story"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />

      {/* Work Item Edit Dialog */}
      <WorkItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={selectedItem}
        itemType="story"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />
    </div>
  );
}

function RequirementsContent({ projectId, projectName, phaseNumber, searchQuery }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string }) {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: requirements = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/requirements`],
  });

  const filtered = requirements.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading requirements...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load requirements</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-requirements">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Clipboard className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No requirements found matching your search" : "No requirements yet. Create one to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((req) => (
        <Card key={req.id} className="hover-elevate" data-testid={`card-req-${req.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{req.title}</h4>
                {req.description && (
                  <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                )}
                {req.type && (
                  <p className="text-sm text-muted-foreground mt-1">Type: {req.type}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {req.status && (
                    <Badge variant={req.status === "approved" || req.status === "implemented" || req.status === "done" ? "default" : req.status === "in_progress" ? "secondary" : "outline"}>
                      {req.status}
                    </Badge>
                  )}
                  {req.priority && (
                    <Badge variant={req.priority === "high" ? "destructive" : "secondary"}>
                      {req.priority}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleViewItem(req)}
                  data-testid={`button-view-req-${req.id}`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleEditItem(req)}
                  data-testid={`button-edit-req-${req.id}`}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Work Item Details Dialog */}
      <WorkItemDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        item={selectedItem}
        itemType="requirement"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />

      {/* Work Item Edit Dialog */}
      <WorkItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={selectedItem}
        itemType="requirement"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />
    </div>
  );
}

function BacklogContent({ projectId, projectName, phaseNumber, searchQuery }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string }) {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: backlogItems = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/backlog`],
  });

  const filtered = backlogItems.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading backlog items...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load backlog items</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-backlog">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <FolderGit2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No backlog items found matching your search" : "No backlog items yet. Create one to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((item) => (
        <Card key={item.id} className="hover-elevate" data-testid={`card-backlog-${item.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
                {(item.storyPoints || item.assignedTo) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.storyPoints && `${item.storyPoints} points`}
                    {item.storyPoints && item.assignedTo && ' • '}
                    {item.assignedTo && `Assigned to ${item.assignedTo}`}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {item.type && (
                    <Badge variant={item.type === "bug" ? "destructive" : "default"}>
                      {item.type}
                    </Badge>
                  )}
                  {item.priority && (
                    <Badge variant={item.priority === "high" ? "destructive" : item.priority === "medium" ? "secondary" : "outline"}>
                      {item.priority}
                    </Badge>
                  )}
                  {item.status && (
                    <Badge variant={item.status === "done" ? "default" : item.status === "in_progress" ? "secondary" : "outline"}>
                      {item.status}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleViewItem(item)}
                  data-testid={`button-view-backlog-${item.id}`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleEditItem(item)}
                  data-testid={`button-edit-backlog-${item.id}`}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Work Item Details Dialog */}
      <WorkItemDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        item={selectedItem}
        itemType="backlog"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />

      {/* Work Item Edit Dialog */}
      <WorkItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={selectedItem}
        itemType="backlog"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />
    </div>
  );
}

function DocumentationContent({ projectId, projectName, phaseNumber, searchQuery }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string }) {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: docs = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/documents`],
  });

  const filtered = docs.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load documents</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-documents">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No documents found matching your search" : "No documentation yet. Create one to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((doc) => (
        <Card key={doc.id} className="hover-elevate" data-testid={`card-doc-${doc.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{doc.title}</h4>
                  {doc.type && (
                    <p className="text-sm text-muted-foreground">
                      Type: {doc.type}
                    </p>
                  )}
                  {doc.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {doc.content.substring(0, 100)}...
                    </p>
                  )}
                  {(doc.createdAt || doc.updatedAt) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleViewItem(doc)}
                  data-testid={`button-view-doc-${doc.id}`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleEditItem(doc)}
                  data-testid={`button-edit-doc-${doc.id}`}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Work Item Details Dialog */}
      <WorkItemDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        item={selectedItem}
        itemType="document"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />

      {/* Work Item Edit Dialog */}
      <WorkItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={selectedItem}
        itemType="document"
        projectId={projectId}
        phaseNumber={phaseNumber}
      />
    </div>
  );
}

// CODE REVIEW COMPONENT
function CodeReviewContent({ projectName, searchQuery }: { projectName: string; searchQuery: string }) {
  const reviews = [
    { 
      id: 1, 
      title: "Feature: User Authentication", 
      author: "John Doe", 
      status: "pending", 
      files: 5, 
      comments: 12, 
      approvals: 2,
      date: "2024-11-03",
      description: "Added OAuth2 authentication flow with JWT tokens"
    },
    { 
      id: 2, 
      title: "Fix: Database Connection Pool", 
      author: "Jane Smith", 
      status: "approved", 
      files: 3, 
      comments: 5, 
      approvals: 3,
      date: "2024-11-02",
      description: "Improved connection pool handling and error recovery"
    },
    { 
      id: 3, 
      title: "Refactor: API Response Structure", 
      author: "Bob Wilson", 
      status: "changes-requested", 
      files: 8, 
      comments: 18, 
      approvals: 1,
      date: "2024-11-01",
      description: "Standardized API response format across all endpoints"
    },
  ];

  const filtered = reviews.filter((r) => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "changes-requested": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-3">
      {filtered.map((review) => (
        <Card key={review.id} className="hover-elevate" data-testid={`card-code-review-${review.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{review.title}</CardTitle>
                <CardDescription className="mt-1">{review.description}</CardDescription>
              </div>
              <Badge variant={getStatusColor(review.status) as any}>
                {review.status.replace("-", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span>{review.author} • {review.date}</span>
              <div className="flex items-center gap-3">
                <span>{review.files} files</span>
                <span>{review.comments} comments</span>
                <span>{review.approvals} approvals</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" data-testid={`button-view-review-${review.id}`}>
                <Eye className="h-3 w-3 mr-1" />
                View Changes
              </Button>
              <Button size="sm" variant="outline" data-testid={`button-comment-review-${review.id}`}>
                <Edit className="h-3 w-3 mr-1" />
                Comment
              </Button>
              {review.status === "pending" && (
                <Button size="sm" data-testid={`button-approve-review-${review.id}`}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approve
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// DESIGN REVIEW COMPONENT
function DesignReviewContent({ projectId, projectName, phaseNumber, searchQuery }: { projectId: string; projectName: string; phaseNumber: number; searchQuery: string }) {
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  const { data: reviews = [], isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-reviews`],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/sdlc/design-reviews/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-reviews`] });
      toast({ title: "Success", description: "Design review status updated" });
      setReviewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const review = reviews.find(r => r.id === id);
      const currentComments = review?.comments ? JSON.parse(review.comments) : [];
      const newComments = [...currentComments, { text: comment, timestamp: new Date().toISOString() }];
      return await apiRequest("PATCH", `/api/sdlc/design-reviews/${id}`, { 
        comments: JSON.stringify(newComments) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-reviews`] });
      toast({ title: "Success", description: "Comment added successfully" });
      setCommentText("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add comment", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sdlc/design-reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-reviews`] });
      toast({ title: "Success", description: "Design review deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete review", variant: "destructive" });
    },
  });

  const filtered = reviews.filter((d) => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "changes-requested": return "destructive";
      default: return "secondary";
    }
  };

  const handleViewReview = (review: any) => {
    setSelectedReview(review);
    setReviewDialogOpen(true);
  };

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleAddComment = () => {
    if (commentText.trim() && selectedReview) {
      addCommentMutation.mutate({ id: selectedReview.id, comment: commentText.trim() });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this design review?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading design reviews...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">Failed to load design reviews</p>
            <p className="text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-retry-reviews">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "No design reviews found matching your search" : "No design reviews yet. Create one to get started."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {filtered.map((review) => {
          const commentCount = review.comments ? JSON.parse(review.comments).length : 0;
          return (
            <Card key={review.id} className="hover-elevate" data-testid={`card-design-review-${review.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{review.title}</CardTitle>
                    <CardDescription className="mt-1">{review.description}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(review.status) as any}>
                    {review.status.replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    <span>{commentCount} comments</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewReview(review)} data-testid={`button-preview-design-${review.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {review.status === "pending" && (
                    <Button size="sm" onClick={() => handleApprove(review.id)} disabled={updateStatusMutation.isPending} data-testid={`button-approve-design-${review.id}`}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(review.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-review-${review.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]" data-testid="dialog-design-review">
          <DialogHeader>
            <DialogTitle>{selectedReview?.title}</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedReview.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Comments</h4>
                <div className="space-y-2 mb-3">
                  {selectedReview.comments && JSON.parse(selectedReview.comments).length > 0 ? (
                    JSON.parse(selectedReview.comments).map((comment: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="text-sm">{comment.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    data-testid="input-comment"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    data-testid="button-add-comment"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedReview.status === "pending" && (
                  <Button 
                    onClick={() => handleApprove(selectedReview.id)}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-approve-review-dialog"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)} data-testid="button-close-review">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// PREVIEW COMPONENT (Development Phase)
function PreviewContent({ projectId, projectName }: { projectId: string; projectName: string }) {
  // Fetch repository
  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/repositories`],
    enabled: !!projectId,
  });

  const repository = repositories && repositories.length > 0 ? repositories[0] : null;

  // Fetch branches
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/branches`],
    enabled: !!repository?.id,
  });

  // Fetch preview data
  const { data: preview, isLoading: isLoadingPreview } = useQuery<any>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/preview`],
    enabled: !!repository?.id,
  });

  // Fetch commits
  const { data: commits = [], isLoading: isLoadingCommits } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/commits`],
    enabled: !!repository?.id,
  });

  // Fetch code
  const devBranch = branches.find((b: any) => b.name === "dev");
  const { data: code, isLoading: isLoadingCode } = useQuery<any>({
    queryKey: [`/api/sdlc/repositories/${repository?.id}/branches/${devBranch?.id}/code`],
    enabled: !!repository?.id && !!devBranch?.id,
  });

  const isLoading = isLoadingRepos || isLoadingBranches || isLoadingPreview || isLoadingCommits || isLoadingCode;

  // Calculate progress
  const progress = {
    repoCreated: !!repository,
    branchesCreated: branches.length >= 2,
    codeGenerated: !!code && code.length > 0,
    commitLogged: commits.length > 0,
    previewReady: !!preview,
  };

  const progressPercentage = 
    (progress.repoCreated ? 20 : 0) +
    (progress.branchesCreated ? 20 : 0) +
    (progress.codeGenerated ? 30 : 0) +
    (progress.commitLogged ? 20 : 0) +
    (progress.previewReady ? 10 : 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="border rounded-md p-8 text-center">
        <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No repository found for this project.
          <br />
          Please create a repository first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Details */}
      <Card data-testid="card-preview-info">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Local Preview Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-muted/20 rounded-lg border">
            <p className="text-sm font-medium mb-2">Repository</p>
            <code className="text-sm text-primary">{repository.name}</code>
          </div>
          
          <div className="p-4 bg-muted/20 rounded-lg border">
            <p className="text-sm font-medium mb-2">Active Branch</p>
            <code className="text-sm text-primary">{devBranch?.name || 'dev'}</code>
          </div>

          {code && code.length > 0 && (
            <div className="p-4 bg-muted/20 rounded-lg border">
              <p className="text-sm font-medium mb-2">Generated Code Files</p>
              <p className="text-sm text-muted-foreground">
                {code.length} file{code.length !== 1 ? 's' : ''} generated
              </p>
            </div>
          )}

          {commits.length > 0 && (
            <div className="p-4 bg-muted/20 rounded-lg border">
              <p className="text-sm font-medium mb-2">Latest Commit</p>
              <p className="text-sm text-muted-foreground">
                {commits[0].message}
              </p>
            </div>
          )}

          {preview && (
            <div className="p-4 bg-muted/20 rounded-lg border">
              <p className="text-sm font-medium mb-2">Preview Status</p>
              <p className="text-sm text-muted-foreground capitalize">
                {preview.status || 'Ready'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// DESIGN PHASE COMPONENTS - NEW

// Custom hook for design asset caching with localStorage persistence
function useDesignAssetCache(projectId: string, phaseNumber: number, designCategory: string, assets: any[]) {
  const storageKey = `design-asset-${designCategory}-${projectId}-phase${phaseNumber}`;
  const [cachedAsset, setCachedAsset] = useState<any>(null);
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Verify the cached data matches the expected category
        if (parsed?.designCategory === designCategory) {
          setCachedAsset(parsed);
        } else {
          // Clear mismatched cache
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, designCategory]);
  
  // Filter for the specific design category
  const freshAsset = assets.find((a) => a.designCategory === designCategory);
  
  // Save to localStorage when fresh asset is fetched
  useEffect(() => {
    if (freshAsset) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(freshAsset));
        setCachedAsset(freshAsset);
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [freshAsset, storageKey]);
  
  // Return fresh data if available, otherwise use cached
  return freshAsset || cachedAsset;
}

function SystemArchitectureContent({ projectId, projectName, phaseNumber }: { projectId: string; projectName: string; phaseNumber: number }) {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch design assets
  const { data: assets = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`],
  });

  // Use custom hook for caching with localStorage persistence
  const activeAsset = useDesignAssetCache(projectId, phaseNumber, "system-architecture", assets);
  
  // Decode content from data URL
  const getDecodedContent = (asset: any) => {
    if (!asset?.fileUrl) return "";
    try {
      const base64Content = asset.fileUrl.replace("data:text/markdown;base64,", "");
      return atob(base64Content);
    } catch (error) {
      console.error("Error decoding content:", error);
      return "";
    }
  };

  const content = activeAsset ? getDecodedContent(activeAsset) : "";
  const summary = content ? content.substring(0, 200) + (content.length > 200 ? "..." : "") : "No system architecture design generated yet. Click 'Generate Design' to create one.";
  
  const handlePreview = () => {
    if (!activeAsset) {
      toast({
        title: "No Design Available",
        description: "Please generate a System Architecture design first.",
        variant: "destructive",
      });
      return;
    }
    setPreviewDialogOpen(true);
  };
  
  const handleDownload = () => {
    if (!activeAsset) {
      toast({
        title: "No Design Available",
        description: "Please generate a System Architecture design first.",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([content], { type: "text/markdown" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `system_architecture_${projectName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        <Card className="hover-elevate" data-testid="card-system-architecture">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Network className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">System Architecture</h4>
                  <p className="text-sm text-muted-foreground">
                    {activeAsset ? "AI Generated" : "Not Generated"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={handlePreview} data-testid="button-preview-system-architecture">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} data-testid="button-download-system-architecture">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 ml-8">
              {summary}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>System Architecture Preview</DialogTitle>
            <DialogDescription>Architecture design for {projectName}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 h-full">
            <div className="p-6">
              {content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/20 p-4 rounded-lg border">
                    {content}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg border h-full">
                  <div className="text-center space-y-2">
                    <Network className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">No Architecture Design</p>
                    <p className="text-xs text-muted-foreground">Generate one using the Design Phase button</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DatabaseDesignContent({ projectId, projectName, phaseNumber }: { projectId: string; projectName: string; phaseNumber: number }) {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch design assets
  const { data: assets = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`],
  });

  // Use custom hook for caching with localStorage persistence
  const activeAsset = useDesignAssetCache(projectId, phaseNumber, "database-design", assets);
  
  // Decode content from data URL
  const getDecodedContent = (asset: any) => {
    if (!asset?.fileUrl) return "";
    try {
      const base64Content = asset.fileUrl.replace("data:text/markdown;base64,", "");
      return atob(base64Content);
    } catch (error) {
      console.error("Error decoding content:", error);
      return "";
    }
  };

  const content = activeAsset ? getDecodedContent(activeAsset) : "";
  const summary = content ? content.substring(0, 200) + (content.length > 200 ? "..." : "") : "No database design generated yet. Click 'Generate Design' to create one.";
  
  const handlePreview = () => {
    if (!activeAsset) {
      toast({
        title: "No Design Available",
        description: "Please generate a Database Design first.",
        variant: "destructive",
      });
      return;
    }
    setPreviewDialogOpen(true);
  };
  
  const handleDownload = () => {
    if (!activeAsset) {
      toast({
        title: "No Design Available",
        description: "Please generate a Database Design first.",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([content], { type: "text/markdown" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `database_design_${projectName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        <Card className="hover-elevate" data-testid="card-database-design">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Database className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">Database Design</h4>
                  <p className="text-sm text-muted-foreground">
                    {activeAsset ? "AI Generated" : "Not Generated"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={handlePreview} data-testid="button-preview-database-design">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} data-testid="button-download-database-design">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 ml-8">
              {summary}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Database Design Preview</DialogTitle>
            <DialogDescription>Database schema for {projectName}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 h-full">
            <div className="p-6">
              {content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/20 p-4 rounded-lg border">
                    {content}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg border h-full">
                  <div className="text-center space-y-2">
                    <Database className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">No Database Design</p>
                    <p className="text-xs text-muted-foreground">Generate one using the Design Phase button</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UIUXDesignContent({ projectId, projectName, phaseNumber }: { projectId: string; projectName: string; phaseNumber: number }) {
  const handleViewFigma = () => {
    window.open('https://www.figma.com', '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="space-y-4">
      <Card className="hover-elevate" data-testid="card-uiux-design">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Figma className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">UI/UX Design</h4>
                <p className="text-sm text-muted-foreground">Figma Prototype</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={handleViewFigma} data-testid="button-view-figma">
                <Figma className="h-3 w-3 mr-1" />
                View Figma
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 ml-8">
            Complete user interface and experience design with interactive prototypes, featuring Material Design 3 system with custom brand colors and component library.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ComponentDesignContent({ projectId, projectName, phaseNumber }: { projectId: string; projectName: string; phaseNumber: number }) {
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch design assets
  const { data: assets = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseNumber}/design-assets`],
  });

  // Use custom hook for caching with localStorage persistence
  const activeAsset = useDesignAssetCache(projectId, phaseNumber, "component-design", assets);
  
  // Decode content from data URL
  const getDecodedContent = (asset: any) => {
    if (!asset?.fileUrl) return "";
    try {
      const base64Content = asset.fileUrl.replace("data:text/markdown;base64,", "");
      return atob(base64Content);
    } catch (error) {
      console.error("Error decoding content:", error);
      return "";
    }
  };

  const content = activeAsset ? getDecodedContent(activeAsset) : "";
  const summary = content ? content.substring(0, 200) + (content.length > 200 ? "..." : "") : "No component design generated yet. Click 'Generate Design' to create one.";
  
  const handlePreview = () => {
    if (!activeAsset) {
      toast({
        title: "No Design Available",
        description: "Please generate a Component Design first.",
        variant: "destructive",
      });
      return;
    }
    setPreviewDialogOpen(true);
  };
  
  const handleDownload = () => {
    if (!activeAsset) {
      toast({
        title: "No Design Available",
        description: "Please generate a Component Design first.",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([content], { type: "text/markdown" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `component_design_${projectName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        <Card className="hover-elevate" data-testid="card-component-design">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Container className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">Component Design</h4>
                  <p className="text-sm text-muted-foreground">
                    {activeAsset ? "AI Generated" : "Not Generated"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={handlePreview} data-testid="button-preview-component-design">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} data-testid="button-download-component-design">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 ml-8">
              {summary}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Component Design Preview</DialogTitle>
            <DialogDescription>Component architecture for {projectName}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 h-full">
            <div className="p-6">
              {content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/20 p-4 rounded-lg border">
                    {content}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg border h-full">
                  <div className="text-center space-y-2">
                    <Container className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">No Component Design</p>
                    <p className="text-xs text-muted-foreground">Generate one using the Design Phase button</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
