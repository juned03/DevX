import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight, GitBranch, CheckCircle2, Circle, Link as LinkIcon, Loader2, ExternalLink, User, Calendar, Tag, TrendingUp, Edit, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdoWorkItemEditDialog } from "@/components/ado-work-item-edit-dialog";
import { AdoWorkItemCreateDialog } from "@/components/ado-work-item-create-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
  projectCount: number;
}

interface WorkItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  linkedItems?: WorkItem[];
}

interface DetailedWorkItem {
  id: string;
  title: string;
  type: string;
  state: string;
  assignedTo: string;
  createdBy: string;
  createdDate: string;
  changedDate: string;
  description: string;
  acceptanceCriteria: string;
  storyPoints: number | null;
  priority: number | null;
  severity: string | null;
  businessValue: number | null;
  timeCriticality: number | null;
  effort: number | null;
  remainingWork: number | null;
  originalEstimate: number | null;
  completedWork: number | null;
  reproSteps: string;
  tags: string;
  iterationPath: string;
  areaPath: string;
  url: string;
  relations: any[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  organization: string;
  organizationUrl?: string;
  artifactOrgId?: string;
  workItemCount?: number;
}

type WorkItemTab = "all" | "epic" | "feature" | "user-story" | "bug" | "task" | "issue" | "linked";

export default function HubArtifacts() {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTab, setSelectedTab] = useState<WorkItemTab>("all");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [selectedWorkItemDetails, setSelectedWorkItemDetails] = useState<DetailedWorkItem | null>(null);
  const [workItemToEdit, setWorkItemToEdit] = useState<DetailedWorkItem | null>(null);
  const [targetWorkItemId, setTargetWorkItemId] = useState("");
  const [linkType, setLinkType] = useState("System.LinkTypes.Hierarchy-Reverse");
  const [linkComboboxOpen, setLinkComboboxOpen] = useState(false);
  const [workItemSearchTerm, setWorkItemSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useQuery<Project[]>({
    queryKey: ["/api/hub/artifacts/projects"],
  });

  const { data: workItems = [], isLoading: isLoadingWorkItems } = useQuery<WorkItem[]>({
    queryKey: selectedProject ? [`/api/hub/artifacts/${selectedProject.name}/work-items`, selectedProject.artifactOrgId, selectedProject.organizationUrl] : [],
    enabled: !!selectedProject,
    queryFn: async () => {
      if (!selectedProject) return [];
      const params = new URLSearchParams();
      if (selectedProject.artifactOrgId) {
        params.append('artifactOrgId', selectedProject.artifactOrgId);
      } else if (selectedProject.organizationUrl) {
        params.append('organizationUrl', selectedProject.organizationUrl);
      }
      const url = `/api/hub/artifacts/${selectedProject.name}/work-items${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return await response.json() as WorkItem[];
    },
  });

  // Fetch work items for autocomplete in link dialog
  const { data: autocompleteWorkItems = [], isLoading: isLoadingAutocomplete } = useQuery<Array<{ id: string; title: string; type: string; state: string }>>({
    queryKey: linkDialogOpen && selectedProject ? [`/api/hub/artifacts/${selectedProject.name}/work-items/autocomplete`, selectedProject.artifactOrgId, selectedProject.organizationUrl, workItemSearchTerm] : [],
    enabled: linkDialogOpen && !!selectedProject,
    queryFn: async () => {
      if (!selectedProject) return [];
      const params = new URLSearchParams();
      if (selectedProject.artifactOrgId) {
        params.append('artifactOrgId', selectedProject.artifactOrgId);
      } else if (selectedProject.organizationUrl) {
        params.append('organizationUrl', selectedProject.organizationUrl);
      }
      // Only search if there's a search term, otherwise get all (limited)
      if (workItemSearchTerm.trim()) {
        params.append('search', workItemSearchTerm.trim());
      }
      const url = `/api/hub/artifacts/${selectedProject.name}/work-items/autocomplete${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return await response.json() as Array<{ id: string; title: string; type: string; state: string }>;
    },
  });

  const fetchWorkItemDetailsMutation = useMutation({
    mutationFn: async (data: { projectName: string; workItemId: string; artifactOrgId?: string; organizationUrl?: string }) => {
      const params = new URLSearchParams();
      if (data.artifactOrgId) {
        params.append('artifactOrgId', data.artifactOrgId);
      } else if (data.organizationUrl) {
        params.append('organizationUrl', data.organizationUrl);
      }
      const url = `/api/hub/artifacts/${data.projectName}/work-item/${data.workItemId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return await response.json() as DetailedWorkItem;
    },
    onSuccess: (data) => {
      setSelectedWorkItemDetails(data);
      setDetailsDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch work item details",
        variant: "destructive",
      });
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (data: { sourceWorkItemId: string; targetWorkItemId: string; linkType: string; projectName: string; artifactOrgId?: string; organizationUrl?: string }) => {
      return await apiRequest("POST", `/api/hub/artifacts/link-work-items`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Work items linked successfully",
      });
      setLinkDialogOpen(false);
      setTargetWorkItemId("");
      if (selectedProject) {
        queryClient.invalidateQueries({ queryKey: [`/api/hub/artifacts/${selectedProject.name}/work-items`] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to link work items",
        variant: "destructive",
      });
    },
  });

  const handleLinkWorkItem = () => {
    if (!selectedWorkItem || !targetWorkItemId || !selectedProject) {
      toast({
        title: "Error",
        description: "Please select a work item and enter a target work item ID",
        variant: "destructive",
      });
      return;
    }

    linkMutation.mutate({
      sourceWorkItemId: selectedWorkItem.id,
      targetWorkItemId,
      linkType,
      projectName: selectedProject.name,
      artifactOrgId: selectedProject.artifactOrgId,
      organizationUrl: selectedProject.organizationUrl
    });
  };

  // Filter work items based on selected tab
  const filteredWorkItems = useMemo(() => {
    if (selectedTab === "all") return workItems;
    if (selectedTab === "linked") {
      // For linked items, show all items that have children
      return workItems.filter(item => item.linkedItems && item.linkedItems.length > 0);
    }
    
    // Map tab to work item type
    const typeMapping: Record<string, string> = {
      "epic": "Epic",
      "feature": "Feature",
      "user-story": "User Story",
      "bug": "Bug",
      "task": "Task",
      "issue": "Issue"
    };
    
    const targetType = typeMapping[selectedTab];
    if (!targetType) return workItems;
    
    // Recursively filter work item tree to only include items of target type
    const filterByType = (item: WorkItem): WorkItem | null => {
      // Filter linked items recursively
      const filteredLinkedItems = item.linkedItems
        ? item.linkedItems.map(filterByType).filter((item): item is WorkItem => item !== null)
        : [];
      
      // If this item matches the target type, include it with filtered children
      if (item.type === targetType) {
        return {
          ...item,
          linkedItems: filteredLinkedItems
        };
      }
      
      // If this item doesn't match but has matching children, return null
      // (children will be collected by parent)
      return null;
    };
    
    // Collect all matching items from the tree
    const collectMatching = (items: WorkItem[]): WorkItem[] => {
      const result: WorkItem[] = [];
      items.forEach(item => {
        const filtered = filterByType(item);
        if (filtered) {
          result.push(filtered);
        }
        // Also check children of non-matching items
        if (item.linkedItems) {
          result.push(...collectMatching(item.linkedItems));
        }
      });
      return result;
    };
    
    return collectMatching(workItems);
  }, [workItems, selectedTab]);

  const organizations = projects.reduce((acc, project) => {
    const org = project.organization || "Default Organization";
    if (!acc.find(o => o.name === org)) {
      acc.push({
        id: org.toLowerCase().replace(/\s+/g, '-'),
        name: org,
        projectCount: projects.filter(p => (p.organization || "Default Organization") === org).length
      });
    }
    return acc;
  }, [] as Organization[]);

  const filteredProjects = selectedOrg
    ? projects.filter(p => (p.organization || "Default Organization") === selectedOrg)
    : projects;

  const handleViewWorkItemDetails = (item: WorkItem) => {
    if (!selectedProject) return;
    fetchWorkItemDetailsMutation.mutate({
      projectName: selectedProject.name,
      workItemId: item.id,
      artifactOrgId: selectedProject.artifactOrgId,
      organizationUrl: selectedProject.organizationUrl
    });
  };

  const handleEditWorkItem = async (item: WorkItem) => {
    if (!selectedProject) return;
    try {
      const params = new URLSearchParams();
      if (selectedProject.artifactOrgId) {
        params.append('artifactOrgId', selectedProject.artifactOrgId);
      } else if (selectedProject.organizationUrl) {
        params.append('organizationUrl', selectedProject.organizationUrl);
      }
      const url = `/api/hub/artifacts/${selectedProject.name}/work-item/${item.id}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      const workItemDetails = await response.json() as DetailedWorkItem;
      setWorkItemToEdit(workItemDetails);
      setEditDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch work item details for editing",
        variant: "destructive",
      });
    }
  };

  const renderWorkItemTree = (item: WorkItem, level = 0) => (
    <div key={item.id} className="space-y-2">
      <div
        className={`flex items-center gap-2 p-3 rounded-md border hover-elevate ${level > 0 ? `ml-${level * 8}` : ''} overflow-hidden`}
        style={level > 0 ? { marginLeft: `${level * 2}rem` } : undefined}
        data-testid={`work-item-${item.id}`}
      >
        <div className="flex-shrink-0 cursor-pointer" onClick={() => handleViewWorkItemDetails(item)}>
          {item.status === "Completed" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 cursor-pointer overflow-hidden" onClick={() => handleViewWorkItemDetails(item)}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {item.type}
            </Badge>
            <Badge
              variant={item.priority === "High" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {item.priority}
            </Badge>
          </div>
          <p className="text-sm font-medium break-words pr-2">{item.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {item.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleEditWorkItem(item);
            }}
            data-testid={`button-edit-${item.id}`}
            title="Edit work item"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedWorkItem(item);
              setLinkDialogOpen(true);
            }}
            data-testid={`button-link-${item.id}`}
            title="Link work item"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {item.linkedItems && item.linkedItems.length > 0 && (
        <div className="space-y-2">
          {item.linkedItems.map(linkedItem => renderWorkItemTree(linkedItem, level + 1))}
        </div>
      )}
    </div>
  );

  const renderLinkedWorkItemFlat = (item: WorkItem) => (
    <div 
      key={item.id} 
      className="flex items-center gap-3 p-4 border-b hover-elevate overflow-hidden"
      data-testid={`linked-work-item-${item.id}`}
    >
      <div className="flex-shrink-0 cursor-pointer" onClick={() => handleViewWorkItemDetails(item)}>
        <Circle className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1 cursor-pointer overflow-hidden" onClick={() => handleViewWorkItemDetails(item)}>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {item.type}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {item.priority}
          </Badge>
        </div>
        <p className="text-sm font-medium break-words pr-2">{item.title}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="secondary" className="text-xs whitespace-nowrap">
          {item.status}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleEditWorkItem(item);
          }}
          data-testid={`button-edit-flat-${item.id}`}
          title="Edit work item"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWorkItem(item);
            setLinkDialogOpen(true);
          }}
          data-testid={`button-link-flat-${item.id}`}
          title="Link work item"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Artifacts
          </h1>
          <p className="text-muted-foreground mt-1">
            View work items from Azure DevOps projects
          </p>
        </div>
      </div>

      {isLoadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projectsError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Failed to load projects. Please check your Azure DevOps settings.</p>
          </CardContent>
        </Card>
      ) : selectedProject ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProject(null);
                setSelectedOrg(null);
              }}
              data-testid="button-back-to-projects"
            >
              ← Back to Projects
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedProject.name}</CardTitle>
                  <CardDescription>{selectedProject.description}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm">
                    {filteredWorkItems.length} Work Items
                  </Badge>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    data-testid="button-create-work-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Work Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as WorkItemTab)} className="w-full">
                <div className="px-6 pt-6 border-b">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="all" data-testid="tab-all">Linked Items</TabsTrigger>
                    <TabsTrigger value="user-story" data-testid="tab-user-story">User Story</TabsTrigger>
                    <TabsTrigger value="epic" data-testid="tab-epic">Epic</TabsTrigger>
                    <TabsTrigger value="feature" data-testid="tab-feature">Feature</TabsTrigger>
                    <TabsTrigger value="bug" data-testid="tab-bug">Bugs</TabsTrigger>
                    <TabsTrigger value="task" data-testid="tab-task">Task</TabsTrigger>
                    <TabsTrigger value="issue" data-testid="tab-issue">Issue</TabsTrigger>
                    <TabsTrigger value="linked" data-testid="tab-linked">Linked Work Item</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={selectedTab} className="m-0">
                  {isLoadingWorkItems ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredWorkItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No work items found</p>
                    </div>
                  ) : selectedTab === "linked" ? (
                    <div className="border-t">
                      {filteredWorkItems.map(item => renderLinkedWorkItemFlat(item))}
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px] p-6 overflow-x-auto">
                      <div className="space-y-3 min-w-0">
                        {filteredWorkItems.map(item => renderWorkItemTree(item))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button
              variant={!selectedOrg ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedOrg(null)}
              data-testid="button-all-orgs"
            >
              All Organizations
            </Button>
            {organizations.map(org => (
              <Button
                key={org.id}
                variant={selectedOrg === org.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOrg(org.name)}
                data-testid={`button-org-${org.id}`}
              >
                {org.name} ({org.projectCount})
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No projects found</p>
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map(project => (
                <Card
                  key={project.id}
                  className="hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GitBranch className="h-4 w-4" />
                      <span>{project.organization || "Default"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={(open) => {
        setLinkDialogOpen(open);
        if (!open) {
          setTargetWorkItemId("");
          setWorkItemSearchTerm("");
          setLinkComboboxOpen(false);
        }
      }}>
        <DialogContent data-testid="dialog-link-work-item">
          <DialogHeader>
            <DialogTitle>Link Work Item</DialogTitle>
            <DialogDescription>
              Link {selectedWorkItem?.title} to another work item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target-work-item-id">Target Work Item</Label>
              <Popover open={linkComboboxOpen} onOpenChange={setLinkComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={linkComboboxOpen}
                    className="w-full justify-between"
                    data-testid="button-target-work-item-combobox"
                    onClick={() => {
                      if (!linkComboboxOpen) {
                        setLinkComboboxOpen(true);
                        // Reset search term when opening to show all items
                        if (!workItemSearchTerm) {
                          setWorkItemSearchTerm("");
                        }
                      }
                    }}
                  >
                    {targetWorkItemId
                      ? (() => {
                          const selectedItem = autocompleteWorkItems.find((item) => item.id === targetWorkItemId);
                          return selectedItem
                            ? `#${targetWorkItemId} - ${selectedItem.title}`
                            : `#${targetWorkItemId}`;
                        })()
                      : "Select or type work item ID..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by ID or title..."
                      value={workItemSearchTerm}
                      onValueChange={(value) => {
                        setWorkItemSearchTerm(value);
                        // If value is a pure number, set it as the ID immediately
                        if (/^\d+$/.test(value)) {
                          setTargetWorkItemId(value);
                        } else if (value === "") {
                          // Clear ID if search is cleared
                          setTargetWorkItemId("");
                        }
                      }}
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                      <CommandEmpty>
                        {isLoadingAutocomplete ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </div>
                        ) : (
                          "No work items found. Try a different search term."
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {autocompleteWorkItems.length > 0 ? (
                          autocompleteWorkItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.id} ${item.title}`}
                              onSelect={() => {
                                setTargetWorkItemId(item.id);
                                setLinkComboboxOpen(false);
                                setWorkItemSearchTerm("");
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  targetWorkItemId === item.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">#{item.id} - {item.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.type} • {item.state}
                                </span>
                              </div>
                            </CommandItem>
                          ))
                        ) : (
                          !isLoadingAutocomplete && workItemSearchTerm && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No work items found. Try a different search term.
                            </div>
                          )
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Type to search by ID or title, or select from the list
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link-type">Link Type</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger id="link-type" data-testid="select-link-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="System.LinkTypes.Hierarchy-Reverse">Child</SelectItem>
                  <SelectItem value="System.LinkTypes.Hierarchy-Forward">Parent</SelectItem>
                  <SelectItem value="System.LinkTypes.Related">Related</SelectItem>
                  <SelectItem value="System.LinkTypes.Dependency-Forward">Successor</SelectItem>
                  <SelectItem value="System.LinkTypes.Dependency-Reverse">Predecessor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the relationship type between the work items
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
              disabled={linkMutation.isPending}
              data-testid="button-cancel-link"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkWorkItem}
              disabled={linkMutation.isPending || !targetWorkItemId}
              data-testid="button-confirm-link"
            >
              {linkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link Work Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden" data-testid="dialog-work-item-details">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">
                  {selectedWorkItemDetails?.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {selectedWorkItemDetails?.type}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedWorkItemDetails?.state}
                  </Badge>
                  {selectedWorkItemDetails?.id && (
                    <span className="text-xs text-muted-foreground">ID: {selectedWorkItemDetails.id}</span>
                  )}
                </div>
              </div>
              {selectedWorkItemDetails?.url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-testid="button-open-in-ado"
                >
                  <a href={selectedWorkItemDetails.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in ADO
                  </a>
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 space-y-6 py-4 pr-4">
              {fetchWorkItemDetailsMutation.isPending ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedWorkItemDetails && (
                <>
                  {/* Metadata Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Assigned To</span>
                      </div>
                      <p className="text-sm">{selectedWorkItemDetails.assignedTo}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Created By</span>
                      </div>
                      <p className="text-sm">{selectedWorkItemDetails.createdBy}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Created Date</span>
                      </div>
                      <p className="text-sm">
                        {new Date(selectedWorkItemDetails.createdDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Changed Date</span>
                      </div>
                      <p className="text-sm">
                        {new Date(selectedWorkItemDetails.changedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Type-specific fields */}
                  {selectedWorkItemDetails.type === "User Story" && (
                    <>
                      {selectedWorkItemDetails.storyPoints && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4" />
                            Story Points
                          </div>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {selectedWorkItemDetails.storyPoints}
                          </Badge>
                        </div>
                      )}

                      {selectedWorkItemDetails.description && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Description</h4>
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedWorkItemDetails.description }}
                          />
                        </div>
                      )}

                      {selectedWorkItemDetails.acceptanceCriteria && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Acceptance Criteria</h4>
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedWorkItemDetails.acceptanceCriteria }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {selectedWorkItemDetails.type === "Epic" && (
                    <>
                      {selectedWorkItemDetails.businessValue && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Business Value</h4>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {selectedWorkItemDetails.businessValue}
                          </Badge>
                        </div>
                      )}

                      {selectedWorkItemDetails.description && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Description</h4>
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedWorkItemDetails.description }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {selectedWorkItemDetails.type === "Feature" && (
                    <>
                      {selectedWorkItemDetails.businessValue && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Business Value</h4>
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {selectedWorkItemDetails.businessValue}
                          </Badge>
                        </div>
                      )}

                      {selectedWorkItemDetails.description && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Description</h4>
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedWorkItemDetails.description }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {selectedWorkItemDetails.type === "Bug" && (
                    <>
                      {selectedWorkItemDetails.severity && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Severity</h4>
                          <Badge 
                            variant={selectedWorkItemDetails.severity === "1 - Critical" ? "destructive" : "secondary"}
                          >
                            {selectedWorkItemDetails.severity}
                          </Badge>
                        </div>
                      )}

                      {selectedWorkItemDetails.reproSteps && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Repro Steps</h4>
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedWorkItemDetails.reproSteps }}
                          />
                        </div>
                      )}

                      {selectedWorkItemDetails.description && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Description</h4>
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedWorkItemDetails.description }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {(selectedWorkItemDetails.type === "Task" || selectedWorkItemDetails.type === "Issue") && (
                    <>
                      {selectedWorkItemDetails.remainingWork !== null && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Remaining Work</h4>
                          <Badge variant="secondary">{selectedWorkItemDetails.remainingWork} hours</Badge>
                        </div>
                      )}

                      {selectedWorkItemDetails.originalEstimate !== null && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Original Estimate</h4>
                          <Badge variant="secondary">{selectedWorkItemDetails.originalEstimate} hours</Badge>
                        </div>
                      )}

                      {selectedWorkItemDetails.completedWork !== null && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Completed Work</h4>
                          <Badge variant="secondary">{selectedWorkItemDetails.completedWork} hours</Badge>
                        </div>
                      )}

                      {selectedWorkItemDetails.description && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Description</h4>
                          <div 
                            className="text-sm prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: selectedWorkItemDetails.description }}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Priority */}
                  {selectedWorkItemDetails.priority && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Priority</h4>
                      <Badge 
                        variant={selectedWorkItemDetails.priority === 1 ? "destructive" : "secondary"}
                      >
                        {selectedWorkItemDetails.priority === 1 ? "High" : selectedWorkItemDetails.priority === 2 ? "Medium" : "Low"}
                      </Badge>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedWorkItemDetails.tags && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Tag className="h-4 w-4" />
                        Tags
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkItemDetails.tags.split(';').filter(Boolean).map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Iteration & Area Paths */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedWorkItemDetails.iterationPath && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Iteration Path</p>
                        <p className="text-sm text-muted-foreground">{selectedWorkItemDetails.iterationPath}</p>
                      </div>
                    )}
                    
                    {selectedWorkItemDetails.areaPath && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Area Path</p>
                        <p className="text-sm text-muted-foreground">{selectedWorkItemDetails.areaPath}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
              data-testid="button-close-details"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdoWorkItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        workItem={workItemToEdit}
        projectName={selectedProject?.name || ""}
        artifactOrgId={selectedProject?.artifactOrgId}
        organizationUrl={selectedProject?.organizationUrl}
      />

      <AdoWorkItemCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectName={selectedProject?.name || ""}
        artifactOrgId={selectedProject?.artifactOrgId}
        organizationUrl={selectedProject?.organizationUrl}
      />
    </div>
  );
}
