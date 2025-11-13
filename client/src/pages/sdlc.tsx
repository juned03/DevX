import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkItemDialog } from "@/components/work-item-dialog";
import { CICDActionDialog } from "@/components/cicd-action-dialog";
import { PhaseFeatureDialog } from "@/components/phase-feature-dialog";
import { PhaseConfirmationCard } from "@/components/phase-confirmation-card";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSearch,
  Palette,
  Code,
  FlaskConical,
  Rocket,
  Wrench,
  FileCode,
  GitBranch,
  Clipboard,
  Users,
  FileText,
  FolderGit2,
  Target,
  UserPlus,
  Link as LinkIcon,
  Repeat,
  Upload,
  Figma,
  Eye,
  GitPullRequest,
  GitCommit,
  GitMerge,
  Tag,
  Send,
  CheckCircle2,
  Play,
  PlayCircle,
  Upload as UploadCloud,
  MonitorDot,
  TrendingUp,
  AlertCircle,
  Flag,
  Star,
  Home,
  ChevronRight,
  Search,
  Bell,
  UserCircle,
  Network,
  Package,
  Settings,
  Archive,
  Shield,
  Tags,
  Globe,
  Server,
  Cloud,
  Activity,
  Zap,
  BookOpen,
  Database,
  Container,
  Sparkles,
  Plus,
  ChevronDown,
  Lock,
  LockOpen,
  Bot,
  User,
  Loader2,
} from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";
import { useToast } from "@/hooks/use-toast";
import type { SDLCProject, SDLCPhase } from "@shared/schema";

type WorkItemType = "issues" | "epics" | "requirements" | "backlog" | "documents";

// SDLC Phases with detailed features and actions - In correct sequential order matching backend phaseNumber
const sdlcPhases = [
  // Phase 1: Requirement & Analysis (backend phaseNumber: 1)
  {
    id: 1,
    name: "Requirement\n& Analysis",
    icon: Bot,
    percentage: 0,
    features: [
      { icon: FileText, label: "User stories" },
      { icon: Clipboard, label: "Requirements" },
      { icon: BookOpen, label: "Documents" },
    ],
    actions: [],
    buttonText: "Workflow",
    buttonIcon: Bot,
    workflowButton: true,
    color: "from-blue-500 to-blue-600",
  },
  // Phase 2: Design (backend phaseNumber: 2)
  {
    id: 2,
    name: "Design",
    icon: Palette,
    percentage: 0,
    features: [
      { icon: Network, label: "System architecture" },
      { icon: Database, label: "Database design" },
      { icon: Container, label: "Component design" },
      { icon: Figma, label: "UI/UX design" },
    ],
    actions: [],
    buttonText: "Push to Repo",
    buttonIcon: Upload,
    workflowButton: false,
    color: "from-pink-500 to-pink-600",
  },
  // Phase 3: Development (backend phaseNumber: 3)
  {
    id: 3,
    name: "Development",
    icon: Code,
    percentage: 0,
    features: [
      { icon: FolderGit2, label: "Repository" },
      { icon: GitBranch, label: "Branches" },
      { icon: Code, label: "Code" },
      { icon: GitCommit, label: "Commits" },
      { icon: Eye, label: "Preview" },
    ],
    actions: [],
    buttonText: "Run Pipeline",
    buttonIcon: Play,
    workflowButton: false,
    color: "from-emerald-500 to-emerald-600",
  },
  // Phase 4: Build & Testing (backend phaseNumber: 4)
  {
    id: 4,
    name: "Build & Testing",
    icon: FlaskConical,
    percentage: 0,
    features: [
      { icon: GitBranch, label: "Pipelines" },
      { icon: Settings, label: "Jobs" },
      { icon: FileText, label: "View test report" },
      { icon: UploadCloud, label: "Publish package" },
    ],
    actions: [],
    buttonText: "Deploy to Prod",
    buttonIcon: Rocket,
    workflowButton: false,
    color: "from-amber-500 to-amber-600",
  },
  // Phase 5: Deployment (backend phaseNumber: 5)
  {
    id: 5,
    name: "Deployment",
    icon: Rocket,
    percentage: 0,
    features: [
      { icon: Package, label: "Releases" },
      { icon: Flag, label: "Feature flags" },
      { icon: Play, label: "Trigger release" },
      { icon: Wrench, label: "Manage rollout" },
    ],
    actions: [],
    buttonText: "Open Monitoring",
    buttonIcon: Activity,
    workflowButton: false,
    color: "from-orange-500 to-orange-600",
  },
  // Phase 6: Maintenance (backend phaseNumber: 6)
  {
    id: 6,
    name: "Maintenance",
    icon: Wrench,
    percentage: 0,
    features: [
      { icon: MonitorDot, label: "Monitor" },
      { icon: AlertCircle, label: "Error tracking" },
      { icon: Bell, label: "Alerts" },
      { icon: Zap, label: "Incidents" },
    ],
    actions: [],
    buttonText: "Generate reports",
    buttonIcon: FileText,
    workflowButton: false,
    color: "from-cyan-500 to-cyan-600",
  },
];

export default function SDLCPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlProjectId = params.get("projectId");
  const projectName = params.get("projectName");
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [generatingDocsPhaseId, setGeneratingDocsPhaseId] = useState<number | null>(null);

  // Work item dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkItemType, setSelectedWorkItemType] = useState<WorkItemType | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [selectedPhaseName, setSelectedPhaseName] = useState<string>("");

  // CI/CD action dialog state
  const [cicdDialogOpen, setCicdDialogOpen] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<"run-cicd" | "view-test-report" | "publish-package" | "trigger-release" | "manage-feature-flags" | "open-monitoring" | "push-code" | "create-mr" | "review-code" | "create-target" | "assign-reviewers" | "link-jira" | "review-design" | "upload-diagram" | "export-figma" | "goto-reports" | null>(null);
  const [actionPhaseName, setActionPhaseName] = useState<string>("");

  // Phase feature dialog state
  const [phaseFeatureDialogOpen, setPhaseFeatureDialogOpen] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<string | null>(null);
  const [selectedPhaseNumber, setSelectedPhaseNumber] = useState<number>(1);

  // Confirmation checkpoint dialog state
  const [confirmationCheckpointDialogOpen, setConfirmationCheckpointDialogOpen] = useState(false);
  const [selectedPhaseForConfirmation, setSelectedPhaseForConfirmation] = useState<SDLCPhase | null>(null);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedConfirmation, setSelectedConfirmation] = useState<any>(null);
  const [featurePhaseName, setFeaturePhaseName] = useState<string>("");

  // AI Design Generation modal state
  const [aiDesignDialogOpen, setAiDesignDialogOpen] = useState(false);
  const [selectedDesignType, setSelectedDesignType] = useState<string>("");
  const [requirementDocument, setRequirementDocument] = useState<string>("");
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [adoDocuments, setAdoDocuments] = useState<any[]>([]);
  const [selectedAdoDocId, setSelectedAdoDocId] = useState<string>("");
  const [isFetchingAdoDocs, setIsFetchingAdoDocs] = useState(false);

  const openWorkItemDialog = (type: WorkItemType, phaseId: number, phaseName: string) => {
    setSelectedWorkItemType(type);
    setSelectedPhaseId(phaseId);
    setSelectedPhaseName(phaseName);
    setDialogOpen(true);
  };

  const openCICDActionDialog = (actionLabel: string, phaseName: string) => {
    const actionType = getActionType(actionLabel);
    if (actionType) {
      setSelectedActionType(actionType);
      setActionPhaseName(phaseName);
      setCicdDialogOpen(true);
    }
  };

  const openPhaseFeatureDialog = (featureLabel: string, phaseName: string, phaseNumber: number) => {
    const featureType = getFeatureType(featureLabel);
    if (featureType) {
      setSelectedFeatureType(featureType);
      setFeaturePhaseName(phaseName);
      setSelectedPhaseNumber(phaseNumber);
      setPhaseFeatureDialogOpen(true);
    }
  };

  const openConfirmationCheckpoint = (phase: SDLCPhase) => {
    setSelectedPhaseForConfirmation(phase);
    setConfirmationCheckpointDialogOpen(true);
  };

  const handleSubmitConfirmation = (confirmation: any) => {
    setSelectedConfirmation(confirmation);
    setConfirmationDialogOpen(true);
  };

  const handleGeneratePhaseDocumentation = async (phaseId: number, phaseName: string) => {
    if (!projectId || !projectName) {
      toast({
        title: "Error",
        description: "Project information is missing",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDocsPhaseId(phaseId);
    
    try {
      toast({
        title: "Generating Documentation",
        description: `Creating comprehensive documentation for ${phaseName}...`,
      });

      const response = await apiRequest(
        "POST",
        `/api/sdlc/projects/${projectId}/phases/${phaseId}/generate-documentation`,
        {
          projectName,
          phaseName,
        }
      );

      const result = await response.json();

      toast({
        title: "Documentation Generated!",
        description: `${phaseName} documentation has been created successfully.`,
      });

      // Refresh the data to show the new document
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}/phases/${phaseId}/documents`] });
      queryClient.invalidateQueries({ queryKey: ["/api/sdlc/default-project"] });
      
      // Optionally open the documentation dialog to show the new document
      openPhaseFeatureDialog("Documentation", phaseName, phaseId);
      
    } catch (error) {
      console.error("Error generating phase documentation:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate phase documentation",
        variant: "destructive",
      });
    } finally {
      setGeneratingDocsPhaseId(null);
    }
  };

  const handleFetchAdoDocuments = async () => {
    if (!projectId) {
      toast({
        title: "Missing Information",
        description: "Project ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingAdoDocs(true);
    try {
      const response = await fetch(getApiUrl(`/api/sdlc/projects/${projectId}/ado-requirements`), {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch documents from ADO");
      }

      const data = await response.json();
      setAdoDocuments(data.documents || []);
      
      toast({
        title: "Documents Fetched",
        description: `Found ${data.documents?.length || 0} requirement documents from Azure DevOps`,
      });
    } catch (error) {
      console.error("Error fetching ADO documents:", error);
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch documents from Azure DevOps",
        variant: "destructive",
      });
    } finally {
      setIsFetchingAdoDocs(false);
    }
  };

  const handleSelectAdoDocument = (docId: string) => {
    setSelectedAdoDocId(docId);
    const selectedDoc = adoDocuments.find(doc => doc.id.toString() === docId);
    if (selectedDoc) {
      // Format the document content nicely with all available fields
      let formattedContent = `# ${selectedDoc.type} - ${selectedDoc.title}

## Work Item ID
${selectedDoc.id}

## Description
${selectedDoc.description || 'No description provided'}

## State
${selectedDoc.state}
`;

      // Add Acceptance Criteria if available
      if (selectedDoc.acceptanceCriteria) {
        formattedContent += `
## Acceptance Criteria
${selectedDoc.acceptanceCriteria}
`;
      }

      // Add Assigned To if available
      if (selectedDoc.assignedTo) {
        formattedContent += `
## Assigned To
${selectedDoc.assignedTo}
`;
      }

      // Add Tags if available
      if (selectedDoc.tags) {
        formattedContent += `
## Tags
${selectedDoc.tags}
`;
      }

      // Add Area Path if available
      if (selectedDoc.areaPath) {
        formattedContent += `
## Area Path
${selectedDoc.areaPath}
`;
      }

      setRequirementDocument(formattedContent);
      
      toast({
        title: "Document Loaded",
        description: `${selectedDoc.type}: ${selectedDoc.title}`,
      });
    }
  };

  const handleGenerateDesignWithAI = async () => {
    // Debug logging to verify state values
    console.log('=== GENERATE DESIGN DEBUG ===');
    console.log('projectId:', projectId);
    console.log('selectedDesignType:', selectedDesignType, 'length:', selectedDesignType?.length);
    console.log('requirementDocument:', requirementDocument, 'length:', requirementDocument?.length);
    
    // Trim whitespace and validate
    const trimmedDesignType = selectedDesignType?.trim();
    const trimmedRequirementDoc = requirementDocument?.trim();
    
    console.log('trimmedDesignType:', trimmedDesignType, 'length:', trimmedDesignType?.length);
    console.log('trimmedRequirementDoc:', trimmedRequirementDoc, 'length:', trimmedRequirementDoc?.length);
    console.log('=== VALIDATION CHECKS ===');
    console.log('projectId check:', !projectId);
    console.log('designType check:', !trimmedDesignType);
    console.log('requirementDoc check:', !trimmedRequirementDoc);
    
    if (!projectId) {
      toast({
        title: "Missing Information",
        description: "Project ID is missing. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    
    if (!trimmedDesignType) {
      toast({
        title: "Missing Information",
        description: "Please select a design type",
        variant: "destructive",
      });
      return;
    }
    
    if (!trimmedRequirementDoc) {
      toast({
        title: "Missing Information",
        description: "Please provide requirements document",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDesign(true);
    
    try {
      toast({
        title: "Generating Design",
        description: `Creating ${trimmedDesignType} using AI... Fetching Azure DevOps backlog context...`,
      });

      const response = await apiRequest(
        "POST",
        `/api/sdlc/projects/${projectId}/generate-design`,
        {
          designType: trimmedDesignType,
          requirementDocument: trimmedRequirementDoc,
        }
      );

      const result = await response.json();

      // Determine section name for success message
      const sectionName = trimmedDesignType;
      
      // Build success message based on ADO data usage
      let successDescription = `${sectionName} generated successfully`;
      if (result.adoDataUsed) {
        successDescription += ' using Azure DevOps backlog context (epics, features, user stories, tasks, and bugs)';
      } else {
        successDescription += ' - Note: No Azure DevOps data found. Please link project repositories or backlog for more accurate designs.';
      }
      if (result.adoWorkItemId) {
        successDescription += ` and synced to ADO (Work Item #${result.adoWorkItemId})`;
      }
      
      toast({
        title: result.adoDataUsed ? "Design Generated with ADO Context!" : "Design Generated!",
        description: successDescription,
        duration: result.adoDataUsed ? 7000 : 5000,
      });

      // Reset modal state
      setAiDesignDialogOpen(false);
      setSelectedDesignType("");
      setRequirementDocument("");
      setAdoDocuments([]);
      setSelectedAdoDocId("");

      // Refresh the data to show the new design
      queryClient.invalidateQueries({ queryKey: ["/api/sdlc/default-project"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sdlc/projects/${projectId}`] });
      // Invalidate all design-assets queries for this project (matches any phase)
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey[0]?.toString().includes(`/api/sdlc/projects/${projectId}`) &&
          query.queryKey[0]?.toString().includes('design-assets')
      });
      
    } catch (error) {
      console.error("Error generating design:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate design",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  // Map feature labels to feature types
  const getFeatureType = (label: string): string | null => {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    
    // Build & Testing
    if (normalizedLabel.includes('pipeline') && !normalizedLabel.includes('editor')) return 'pipelines';
    if (normalizedLabel.includes('jobs')) return 'jobs';
    if (normalizedLabel.includes('pipelineeditor')) return 'pipeline-editor';
    if (normalizedLabel.includes('artifact')) return 'artifacts';
    if (normalizedLabel.includes('security')) return 'security-config';
    
    // Deployment
    if (normalizedLabel.includes('releases')) return 'releases';
    if (normalizedLabel.includes('featureflag')) return 'feature-flags';
    if (normalizedLabel.includes('packageregistry')) return 'package-registry';
    if (normalizedLabel.includes('modelregistry')) return 'model-registry';
    
    // Development
    if (normalizedLabel === 'code') return 'code';
    if (normalizedLabel.includes('repository') && !normalizedLabel.includes('graph')) return 'repository';
    if (normalizedLabel.includes('branch')) return 'branches';
    if (normalizedLabel.includes('commit')) return 'commits';
    if (normalizedLabel.includes('mergerequest')) return 'merge-requests';
    if (normalizedLabel.includes('tags')) return 'tags';
    if (normalizedLabel.includes('preview')) return 'preview';
    if (normalizedLabel.includes('reviewcode')) return 'review-code';
    
    // Design
    if (normalizedLabel.includes('systemarchitecture')) return 'system-architecture';
    if (normalizedLabel.includes('databasedesign')) return 'database-design';
    if (normalizedLabel.includes('ui/uxdesign') || normalizedLabel.includes('uiuxdesign')) return 'ui-ux-design';
    if (normalizedLabel.includes('componentdesign')) return 'component-design';
    if (normalizedLabel.includes('snippet')) return 'snippets';
    if (normalizedLabel.includes('repositorygraph')) return 'repository-graph';
    if (normalizedLabel.includes('designasset')) return 'design-assets';
    if (normalizedLabel.includes('figma')) return 'figma-link';
    if (normalizedLabel.includes('reviewdesign')) return 'review-design';
    
    // Maintenance
    if (normalizedLabel.includes('environment')) return 'environments';
    if (normalizedLabel.includes('kubernetes')) return 'kubernetes-clusters';
    if (normalizedLabel.includes('terraform')) return 'terraform-states';
    if (normalizedLabel.includes('monitor')) return 'monitor';
    if (normalizedLabel.includes('errortracking')) return 'error-tracking';
    if (normalizedLabel.includes('alert')) return 'alerts';
    if (normalizedLabel.includes('incident')) return 'incidents';
    if (normalizedLabel.includes('valuestream')) return 'value-stream-analytics';
    
    // Requirements & Analysis
    if (normalizedLabel.includes('epic')) return 'epics';
    if (normalizedLabel.includes('userstories')) return 'user-stories';
    if (normalizedLabel.includes('requirement')) return 'requirements';
    if (normalizedLabel.includes('backlog')) return 'backlog';
    if (normalizedLabel.includes('document')) return 'documentation';
    
    return null;
  };

  // Map feature labels to work item types (legacy)
  const getWorkItemType = (label: string): WorkItemType | null => {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    if (normalizedLabel.includes('issue')) return 'issues';
    if (normalizedLabel.includes('epic')) return 'epics';
    if (normalizedLabel.includes('requirement')) return 'requirements';
    if (normalizedLabel.includes('backlog')) return 'backlog';
    if (normalizedLabel.includes('doc')) return 'documents';
    return null;
  };

  // Map action labels to action types
  const getActionType = (label: string): "run-cicd" | "view-test-report" | "publish-package" | "trigger-release" | "manage-feature-flags" | "open-monitoring" | "push-code" | "create-mr" | "review-code" | "create-target" | "assign-reviewers" | "link-jira" | "review-design" | "upload-diagram" | "export-figma" | "goto-reports" | null => {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '');
    
    // Primary button texts
    if (normalizedLabel.includes('deploytoprod') || normalizedLabel.includes('rundeployment')) return 'trigger-release';
    if (normalizedLabel.includes('openmonitoring')) return 'open-monitoring';
    if (normalizedLabel.includes('runpipeline')) return 'run-cicd';
    if (normalizedLabel.includes('pushtorepo')) return 'push-code';
    if (normalizedLabel.includes('generatedocs')) return 'create-target';
    if (normalizedLabel.includes('generatereports')) return 'goto-reports';
    
    // Build & Testing actions
    if (normalizedLabel.includes('runci') || normalizedLabel.includes('runcd')) return 'run-cicd';
    if (normalizedLabel.includes('viewtest') || normalizedLabel.includes('testreport')) return 'view-test-report';
    if (normalizedLabel.includes('publish') && normalizedLabel.includes('package')) return 'publish-package';
    
    // Deployment actions
    if (normalizedLabel.includes('trigger') || normalizedLabel.includes('release')) return 'trigger-release';
    if (normalizedLabel.includes('manage') || normalizedLabel.includes('feature')) return 'manage-feature-flags';
    if (normalizedLabel.includes('monitoring') || normalizedLabel.includes('pi/click')) return 'open-monitoring';
    
    // Development actions
    if (normalizedLabel.includes('pushcode')) return 'push-code';
    if (normalizedLabel.includes('createmr')) return 'create-mr';
    if (normalizedLabel.includes('reviewcode')) return 'review-code';
    
    // Requirements actions
    if (normalizedLabel.includes('createtarget')) return 'create-target';
    if (normalizedLabel.includes('assignreviewer')) return 'assign-reviewers';
    if (normalizedLabel.includes('linkjira') || normalizedLabel.includes('jiraticket')) return 'link-jira';
    
    // Design actions
    if (normalizedLabel.includes('reviewdesign')) return 'review-design';
    if (normalizedLabel.includes('upload') && normalizedLabel.includes('diagram')) return 'upload-diagram';
    if (normalizedLabel.includes('exportfigma') || normalizedLabel.includes('exporttofigma')) return 'export-figma';
    
    // Maintenance actions
    if (normalizedLabel.includes('gotoreports') || normalizedLabel.includes('reports')) return 'goto-reports';
    
    return null;
  };

  // Fetch all projects for dropdown
  const { data: allProjects } = useQuery<SDLCProject[]>({
    queryKey: ["/api/sdlc/projects"],
    queryFn: async () => {
      const response = await fetch(getApiUrl("/api/sdlc/projects"), {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Fetch project and phases (either specific project or default)
  const { data, isLoading, isError } = useQuery<{ project: SDLCProject; phases: SDLCPhase[]; repository?: any }>({
    queryKey: urlProjectId ? ["/api/sdlc/projects", urlProjectId] : ["/api/sdlc/default-project"],
    queryFn: async () => {
      if (urlProjectId) {
        // Fetch specific project
        const projectResponse = await fetch(getApiUrl(`/api/sdlc/projects/${urlProjectId}/details`), {
          credentials: "include",
        });
        if (!projectResponse.ok) {
          const errorText = await projectResponse.text();
          throw new Error(`Failed to fetch project: ${errorText}`);
        }
        return projectResponse.json();
      } else {
        // Fetch default project
        const response = await fetch(getApiUrl("/api/sdlc/default-project"), {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch default project");
        return response.json();
      }
    },
    retry: 1,
  });
  
  // Get projectId from URL params or from fetched default project
  const projectId = urlProjectId || data?.project?.id?.toString() || null;

  // Fetch counts for Phase 1 (Requirement & Analysis) categories
  const { data: backlogItems = [] } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/1/backlog`],
    enabled: !!projectId,
  });

  const { data: requirementsItems = [] } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/1/requirements`],
    enabled: !!projectId,
  });

  const { data: documentsItems = [] } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/phases/1/documents`],
    enabled: !!projectId,
  });

  // Fetch repository data for Phase 3 (Development) progress calculation
  const { data: repositoriesData } = useQuery<any[]>({
    queryKey: [`/api/sdlc/projects/${projectId}/repositories`],
    enabled: !!projectId,
    retry: false,
  });

  // Get the first repository ID if it exists
  const developmentRepositoryId = repositoriesData && repositoriesData.length > 0 ? repositoriesData[0].id : null;

  const { data: branchesData } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${developmentRepositoryId}/branches`],
    enabled: !!developmentRepositoryId,
    retry: false,
  });

  // Get the first branch ID if it exists  
  const developmentBranchId = branchesData && branchesData.length > 0 ? branchesData[0].id : null;

  const { data: codeData } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${developmentRepositoryId}/branches/${developmentBranchId}/code`],
    enabled: !!developmentRepositoryId && !!developmentBranchId,
    retry: false,
  });

  const { data: commitsData } = useQuery<any[]>({
    queryKey: [`/api/sdlc/repositories/${developmentRepositoryId}/commits`],
    enabled: !!developmentRepositoryId,
    retry: false,
  });

  const { data: previewData } = useQuery<any>({
    queryKey: [`/api/sdlc/repositories/${developmentRepositoryId}/preview`],
    enabled: !!developmentRepositoryId,
    retry: false,
  });

  // Mutation for updating confirmations
  const updateConfirmationMutation = useMutation({
    mutationFn: async ({ confirmationId, data: confirmationData }: { confirmationId: string; data: { status: string; confirmerName: string; comments: string } }) => {
      const response = await fetch(getApiUrl(`/api/sdlc/confirmations/${confirmationId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(confirmationData),
      });
      if (!response.ok) throw new Error("Failed to update confirmation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Confirmation Updated",
        description: "Your confirmation has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sdlc/confirmations"] });
      setConfirmationDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update confirmation",
        variant: "destructive",
      });
    },
  });

  const getPhaseProgress = (phaseId: number): number => {
    // Special calculation for Development Phase (Phase 3)
    if (phaseId === 3) {
      return getDevelopmentProgress();
    }
    
    const phaseStatus = data?.phases.find((p) => p.phaseNumber === phaseId);
    return phaseStatus?.progress || 0;
  };

  // Calculate Development Phase progress based on 5 steps
  const getDevelopmentProgress = (): number => {
    let progress = 0;
    
    // Repo Created – 20%
    // Verify repository exists with ID and valid status
    if (
      repositoriesData && 
      Array.isArray(repositoriesData) && 
      repositoriesData.length > 0 && 
      repositoriesData[0]?.id &&
      repositoriesData[0]?.status // Verify status field exists (e.g., "active")
    ) {
      progress += 20;
    }
    
    // Branches Created – 20%
    // Verify at least one branch exists with ID
    if (
      branchesData && 
      Array.isArray(branchesData) && 
      branchesData.length > 0 &&
      branchesData[0]?.id // Verify first branch has ID
    ) {
      progress += 20;
    }
    
    // Code Generated – 30%
    // Verify at least one code file exists with ID and content
    if (
      codeData && 
      Array.isArray(codeData) && 
      codeData.length > 0 &&
      codeData[0]?.id &&
      codeData[0]?.content // Verify code file has content
    ) {
      progress += 30;
    }
    
    // Commit Logged – 20%
    // Verify at least one commit exists with ID and message
    if (
      commitsData && 
      Array.isArray(commitsData) && 
      commitsData.length > 0 &&
      commitsData[0]?.id &&
      commitsData[0]?.message // Verify commit has message
    ) {
      progress += 20;
    }
    
    // Preview Ready – 10%
    // Verify preview exists with ID and valid status
    if (
      previewData && 
      typeof previewData === 'object' && 
      previewData.id &&
      (previewData.status === 'active' || previewData.codeStatus === 'generated') // Verify preview is ready
    ) {
      progress += 10;
    }
    
    return progress;
  };

  // Get count for a specific feature based on its label and phase
  const getFeatureCount = (phaseId: number, featureLabel: string): number => {
    if (phaseId !== 1) return 0; // Only show counts for Phase 1 for now
    
    const normalizedLabel = featureLabel.toLowerCase().replace(/\s+/g, '');
    
    if (normalizedLabel.includes('userstories') || normalizedLabel.includes('userstory')) {
      return backlogItems.length;
    }
    if (normalizedLabel.includes('requirement')) {
      return requirementsItems.length;
    }
    if (normalizedLabel.includes('document')) {
      return documentsItems.length;
    }
    
    return 0;
  };

  // Helper function to determine if a feature is a category feature
  const isCategoryFeature = (featureLabel: string): boolean => {
    const normalizedLabel = featureLabel.toLowerCase().replace(/\s+/g, '');
    return (
      normalizedLabel.includes('userstories') ||
      normalizedLabel.includes('userstory') ||
      normalizedLabel.includes('requirement') ||
      normalizedLabel.includes('backlog') ||
      normalizedLabel.includes('documentation') ||
      normalizedLabel.includes('doc') ||
      normalizedLabel.includes('epic') ||
      normalizedLabel.includes('issue')
    );
  };

  // Helper function to determine if a feature category is completed
  const isFeatureCategoryCompleted = (phaseId: number, featureLabel: string): boolean => {
    const phaseData = data?.phases.find((p) => p.phaseNumber === phaseId);
    if (!phaseData) return false;
    
    const categoryCompletion = (phaseData as any).categoryCompletion;
    if (!categoryCompletion) return false;
    
    const normalizedLabel = featureLabel.toLowerCase().replace(/\s+/g, '');
    
    // Map feature labels to category completion fields
    if (normalizedLabel.includes('userstories') || normalizedLabel.includes('userstory')) {
      return categoryCompletion.hasBacklog; // User stories are stored as backlog items
    }
    if (normalizedLabel.includes('requirement')) {
      return categoryCompletion.hasRequirements;
    }
    if (normalizedLabel.includes('backlog')) {
      return categoryCompletion.hasBacklog;
    }
    if (normalizedLabel.includes('documentation') || normalizedLabel.includes('doc')) {
      return categoryCompletion.hasDocuments;
    }
    if (normalizedLabel.includes('epic')) {
      return categoryCompletion.hasEpics;
    }
    if (normalizedLabel.includes('issue')) {
      return categoryCompletion.hasIssues;
    }
    
    return false;
  };

  // Determine if a phase is locked (not yet accessible)
  const isPhaseLocked = (phaseId: number): boolean => {
    if (!data?.phases) return false;
    
    // Phase 1 is never locked
    if (phaseId === 1) return false;
    
    // Check if all previous phases have reached 80% progress (simplified unlocking - no confirmations required)
    for (let i = 1; i < phaseId; i++) {
      const previousPhase = data.phases.find((p) => p.phaseNumber === i);
      if (!previousPhase) return true; // If phase doesn't exist, lock this one
      
      // Check if previous phase has reached 80% progress
      if ((previousPhase.progress || 0) < 80) {
        return true;
      }
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-muted">
            <Code className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading SDLC workflow...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Failed to load SDLC data</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page or contact support if the issue persists.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            <Link href="/projects">
              <Button variant="outline">Back to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Breadcrumb and Actions */}
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" data-testid="breadcrumb-navigation">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 px-2" data-testid="link-home">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="px-2" data-testid="link-projects">
                  Projects
                </Button>
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium" data-testid="text-current-page">SDLC</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold absolute left-1/2 transform -translate-x-1/2" data-testid="heading-page-title">
              SDLC Workflow
            </h1>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-search">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-profile">
                <UserCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Project Selector and Create Button */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              <Select
                value={projectId || data?.project?.id || ""}
                onValueChange={(value) => {
                  if (value) {
                    const selectedProject = allProjects?.find(p => p.id === value);
                    if (selectedProject) {
                      setLocation(`/sdlc?projectId=${value}&projectName=${encodeURIComponent(selectedProject.name)}`);
                    }
                  }
                }}
              >
                <SelectTrigger className="w-[300px]" data-testid="select-project">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {allProjects && allProjects.length > 0 ? (
                    allProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-projects" disabled>
                      No projects available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Link href="/projects">
              <Button size="sm" data-testid="button-create-sdlc-project">
                <Plus className="h-4 w-4 mr-2" />
                Create SDLC-Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Horizontal Phases */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {sdlcPhases.map((phase, index) => {
            const progress = getPhaseProgress(phase.id);
            const isLocked = isPhaseLocked(phase.id);
            
            return (
              <Card 
                key={phase.id} 
                className="flex flex-col hover-elevate"
                data-testid={`card-phase-${phase.id}`}
              >
                <CardContent className="p-4 flex flex-col h-full">
                  {/* Phase Icon and Name */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${phase.color}`}>
                        <phase.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 
                          className="font-semibold text-sm leading-tight whitespace-pre-line" 
                          data-testid={`text-phase-name-${phase.id}`}
                        >
                          {phase.name}
                        </h3>
                        {progress >= 80 && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" data-testid={`icon-phase-complete-${phase.id}`} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-primary" data-testid={`text-progress-${phase.id}`}>
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-1.5" data-testid={`progress-bar-${phase.id}`} />
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 mb-4 flex-1">
                    {phase.features.map((feature, idx) => {
                      const featureType = getFeatureType(feature.label);
                      const isClickable = featureType !== null && data?.project?.id;
                      const showCheckbox = isCategoryFeature(feature.label) && phase.id !== 1; // Hide checkboxes for phase 1
                      const isCompleted = showCheckbox ? isFeatureCategoryCompleted(phase.id, feature.label) : false;
                      const isFigmaLink = feature.label.toLowerCase().includes('figma link');
                      const featureCount = getFeatureCount(phase.id, feature.label);
                      const showBadge = featureCount > 0;
                      
                      return (
                        <div key={idx} className="flex items-center gap-1.5">
                          <button
                            className={`flex items-start gap-2 text-xs flex-1 text-left p-1.5 rounded-md ${
                              isClickable ? 'hover-elevate active-elevate-2 cursor-pointer' : 'cursor-not-allowed'
                            }`}
                            onClick={() => isClickable && openPhaseFeatureDialog(feature.label, phase.name, phase.id)}
                            disabled={!isClickable}
                            data-testid={`feature-${phase.id}-${idx}`}
                          >
                            {showCheckbox && (
                              <Checkbox
                                checked={isCompleted}
                                className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 pointer-events-none"
                                data-testid={`checkbox-feature-${phase.id}-${idx}`}
                              />
                            )}
                            <feature.icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="text-muted-foreground leading-tight whitespace-pre-line flex-1">
                              {feature.label}
                            </span>
                            {showBadge && (
                              <Badge 
                                variant="secondary" 
                                className="h-4 min-w-[1rem] px-1 text-[10px] font-semibold flex items-center justify-center rounded-full"
                                data-testid={`badge-count-${phase.id}-${idx}`}
                              >
                                {featureCount}
                              </Badge>
                            )}
                          </button>
                          {isFigmaLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open('https://www.figma.com', '_blank', 'noopener,noreferrer');
                              }}
                              data-testid={`button-open-figma-${phase.id}`}
                            >
                              <Figma className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions List - Only show if phase has actions */}
                  {phase.actions.length > 0 && (
                    <>
                      {/* Divider */}
                      <div className="border-t my-3" />
                      
                      <div className="space-y-2 mb-4">
                        {phase.actions.map((action: any, idx) => {
                          const actionType = getActionType(action.label);
                          const isActionClickable = actionType !== null && data?.project?.id;
                          
                          return (
                            <button
                              key={idx}
                              className={`flex items-start gap-2 text-xs w-full text-left p-1.5 rounded-md ${
                                isActionClickable ? 'hover-elevate active-elevate-2 cursor-pointer' : 'cursor-not-allowed'
                              }`}
                              onClick={() => isActionClickable && openCICDActionDialog(action.label, phase.name)}
                              disabled={!isActionClickable}
                              data-testid={`action-${phase.id}-${idx}`}
                            >
                              <action.icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight whitespace-pre-line">{action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Checkpoint Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      const phaseData = data?.phases.find((p) => p.phaseNumber === phase.id);
                      if (phaseData) {
                        openConfirmationCheckpoint(phaseData);
                      }
                    }}
                    data-testid={`button-checkpoint-${phase.id}`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Checkpoint
                  </Button>

                  {/* Create Repo Button - Only for Development Phase */}
                  {phase.id === 3 && (
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      onClick={() => openPhaseFeatureDialog('Repository', phase.name, phase.id)}
                      data-testid="button-create-repo"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Repo
                    </Button>
                  )}

                  {/* Generate Design Button (only for Design phase) */}
                  {phase.id === 2 && (
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      onClick={() => setAiDesignDialogOpen(true)}
                      data-testid="button-generate-design-ai"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Design
                    </Button>
                  )}

                  {/* Workflow Button (only for Requirement & Analysis phase) - Make it blue/primary */}
                  {(phase as any).workflowButton && (
                    <Link href="/workflow">
                      <Button 
                        className="w-full mt-2" 
                        size="sm"
                        data-testid="button-workflow"
                      >
                        <phase.buttonIcon className="h-4 w-4 mr-2" />
                        {phase.buttonText}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Work Item Dialog */}
      {selectedWorkItemType && selectedPhaseId && data?.project?.id && (
        <WorkItemDialog
          projectId={data.project.id}
          phaseId={selectedPhaseId}
          phaseName={selectedPhaseName}
          type={selectedWorkItemType}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}

      {/* CI/CD Action Dialog */}
      {data?.project?.id && (
        <CICDActionDialog
          open={cicdDialogOpen}
          onOpenChange={setCicdDialogOpen}
          actionType={selectedActionType}
          projectId={data.project.id}
          projectName={data.project.name}
          phaseName={actionPhaseName}
        />
      )}

      {/* Phase Feature Dialog */}
      {data?.project?.id && (
        <PhaseFeatureDialog
          open={phaseFeatureDialogOpen}
          onOpenChange={setPhaseFeatureDialogOpen}
          featureType={selectedFeatureType as any}
          projectId={data.project.id}
          projectName={data.project.name}
          phaseName={featurePhaseName}
          phaseNumber={selectedPhaseNumber}
        />
      )}

      {/* Confirmation Checkpoint Dialog */}
      {selectedPhaseForConfirmation && (
        <Dialog open={confirmationCheckpointDialogOpen} onOpenChange={setConfirmationCheckpointDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-confirmation-checkpoint">
            <DialogHeader>
              <DialogTitle>Phase Confirmation Checkpoint</DialogTitle>
            </DialogHeader>
            <ConfirmationCheckpointContent
              phase={selectedPhaseForConfirmation}
              onSubmitConfirmation={handleSubmitConfirmation}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Submission Dialog */}
      {selectedConfirmation && (
        <ConfirmationDialog
          open={confirmationDialogOpen}
          onOpenChange={setConfirmationDialogOpen}
          confirmation={selectedConfirmation}
          onSubmit={(data) => {
            updateConfirmationMutation.mutate({
              confirmationId: selectedConfirmation.id,
              data,
            });
          }}
        />
      )}

      {/* AI Design Generation Dialog */}
      <Dialog open={aiDesignDialogOpen} onOpenChange={setAiDesignDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-ai-design-generation">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Design with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="design-type" className="text-sm font-medium">
                Design Type
              </label>
              <Select 
                value={selectedDesignType} 
                onValueChange={setSelectedDesignType}
                data-testid="select-design-type"
              >
                <SelectTrigger id="design-type" data-testid="trigger-design-type">
                  <SelectValue placeholder="Select design type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="System Architecture" data-testid="option-system-architecture">
                    System Architecture
                  </SelectItem>
                  <SelectItem value="Database Design" data-testid="option-database-design">
                    Database Design
                  </SelectItem>
                  <SelectItem value="Component Design" data-testid="option-component-design">
                    Component Design
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="requirement-document" className="text-sm font-medium">
                  Requirement/Analysis Document
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFetchAdoDocuments}
                  disabled={isFetchingAdoDocs}
                  data-testid="button-fetch-ado-docs"
                >
                  {isFetchingAdoDocs ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3 w-3 mr-2" />
                      Fetch from ADO
                    </>
                  )}
                </Button>
              </div>

              {adoDocuments.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="ado-doc-select" className="text-sm font-medium">
                    Select from Azure DevOps ({adoDocuments.length} available)
                  </label>
                  <Select
                    value={selectedAdoDocId}
                    onValueChange={handleSelectAdoDocument}
                    data-testid="select-ado-document"
                  >
                    <SelectTrigger id="ado-doc-select" data-testid="trigger-ado-document">
                      <SelectValue placeholder="Select a requirement document..." />
                    </SelectTrigger>
                    <SelectContent>
                      {adoDocuments.map((doc) => (
                        <SelectItem 
                          key={doc.id} 
                          value={doc.id.toString()}
                          data-testid={`option-ado-doc-${doc.id}`}
                        >
                          [{doc.type}] {doc.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <textarea
                id="requirement-document"
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Paste or type your requirement/analysis document here, or fetch from Azure DevOps above..."
                value={requirementDocument}
                onChange={(e) => setRequirementDocument(e.target.value)}
                data-testid="textarea-requirement-document"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAiDesignDialogOpen(false);
                  setSelectedDesignType("");
                  setRequirementDocument("");
                  setAdoDocuments([]);
                  setSelectedAdoDocId("");
                }}
                disabled={isGeneratingDesign}
                data-testid="button-cancel-design"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateDesignWithAI}
                disabled={!selectedDesignType || !requirementDocument || isGeneratingDesign}
                data-testid="button-submit-design"
              >
                {isGeneratingDesign ? (
                  <>
                    <span className="mr-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Design
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component to fetch and display confirmation data
function ConfirmationCheckpointContent({
  phase,
  onSubmitConfirmation,
}: {
  phase: SDLCPhase;
  onSubmitConfirmation: (confirmation: any) => void;
}) {
  const { data: confirmations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sdlc/confirmations", phase.id],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/sdlc/phases/${phase.id}/confirmations`), {
        credentials: "include",
      });
      if (!response.ok) {
        // If no confirmations exist, initialize them
        if (response.status === 404 || response.status === 500) {
          const initResponse = await fetch(getApiUrl(`/api/sdlc/phases/${phase.id}/confirmations/initialize`), {
            method: "POST",
            credentials: "include",
          });
          if (!initResponse.ok) throw new Error("Failed to initialize confirmations");
          return initResponse.json();
        }
        throw new Error("Failed to fetch confirmations");
      }
      
      const data = await response.json();
      
      // If confirmations array is empty, initialize them
      if (data.length === 0) {
        const initResponse = await fetch(`/api/sdlc/phases/${phase.id}/confirmations/initialize`, {
          method: "POST",
          credentials: "include",
        });
        if (!initResponse.ok) throw new Error("Failed to initialize confirmations");
        return initResponse.json();
      }
      
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-6 text-center">Loading confirmations...</div>;
  }

  return (
    <PhaseConfirmationCard
      phaseId={phase.id}
      phaseName={phase.phaseName}
      confirmations={confirmations || []}
      onSubmitConfirmation={onSubmitConfirmation}
    />
  );
}
