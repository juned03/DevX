import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Plus, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ArtifactsOrganization {
  id: string;
  projectName: string;
  organizationUrl: string;
  patConfigured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GoldenRepoOrganization {
  id: string;
  name: string;
  organizationUrl: string;
  projectName: string;
  repositoryName: string;
  apiVersion: string;
  patConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}



export default function Settings() {
  const { toast } = useToast();

  // Artifacts Organizations Query
  const { data: artifactOrgsData, error: artifactOrgsError } = useQuery<{ organizations: ArtifactsOrganization[] }>({
    queryKey: ["/api/artifact-organizations"],
    retry: false,
  });

  const artifactsOrgs = artifactOrgsData?.organizations || [];
  const isEncryptionAvailable = !artifactOrgsError;
  
  const [addOrgDialogOpen, setAddOrgDialogOpen] = useState(false);
  const [newOrgData, setNewOrgData] = useState({
    projectName: "",
    organizationUrl: "",
    patToken: ""
  });
  const [configurePATDialogOpen, setConfigurePATDialogOpen] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [patTokenInput, setPATTokenInput] = useState("");

  // Golden Repo Organizations Query
  const { data: goldenRepoOrgsData } = useQuery<{ organizations: GoldenRepoOrganization[] }>({
    queryKey: ["/api/golden-repo-organizations"],
  });

  const goldenRepoOrgs = goldenRepoOrgsData?.organizations || [];

  // Golden Repo state
  const [addGoldenRepoDialogOpen, setAddGoldenRepoDialogOpen] = useState(false);
  const [editGoldenRepoDialogOpen, setEditGoldenRepoDialogOpen] = useState(false);
  const [editingGoldenRepoId, setEditingGoldenRepoId] = useState<string | null>(null);
  const [goldenRepoFormData, setGoldenRepoFormData] = useState({
    name: "",
    organizationUrl: "",
    projectName: "",
    repositoryName: "",
    apiVersion: "7.1",
    patToken: ""
  });

  const isLoading = false;

  // Create artifact organization mutation
  const createArtifactOrgMutation = useMutation({
    mutationFn: async (data: { projectName: string; organizationUrl: string; patToken?: string }) => {
      const response = await apiRequest("POST", "/api/artifact-organizations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifact-organizations"] });
      setNewOrgData({ projectName: "", organizationUrl: "", patToken: "" });
      setAddOrgDialogOpen(false);
      toast({
        title: "Organization Added",
        description: "Organization has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Organization",
        description: error.message || "Could not add organization",
        variant: "destructive",
      });
    },
  });

  // Artifacts Organization Handlers
  const handleAddOrganization = () => {
    if (!newOrgData.projectName || !newOrgData.organizationUrl) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createArtifactOrgMutation.mutate(newOrgData);
  };

  // Delete artifact organization mutation
  const deleteArtifactOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/artifact-organizations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifact-organizations"] });
      toast({
        title: "Organization Removed",
        description: "Organization has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Organization",
        description: error.message || "Could not remove organization",
        variant: "destructive",
      });
    },
  });

  const handleRemoveOrganization = (id: string) => {
    deleteArtifactOrgMutation.mutate(id);
  };

  const handleConfigurePAT = (orgId: string) => {
    setEditingOrgId(orgId);
    setPATTokenInput("");
    setConfigurePATDialogOpen(true);
  };

  // Update artifact organization mutation (for PAT configuration)
  const updateArtifactOrgMutation = useMutation({
    mutationFn: async ({ id, patToken }: { id: string; patToken: string }) => {
      const response = await apiRequest("PUT", `/api/artifact-organizations/${id}`, { patToken });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifact-organizations"] });
      setConfigurePATDialogOpen(false);
      setEditingOrgId(null);
      setPATTokenInput("");
      toast({
        title: "PAT Token Configured",
        description: "PAT token has been configured successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Configure PAT",
        description: error.message || "Could not configure PAT token",
        variant: "destructive",
      });
    },
  });

  const handleSavePAT = () => {
    if (!editingOrgId || !patTokenInput) {
      toast({
        title: "Validation Error",
        description: "Please enter a PAT token",
        variant: "destructive",
      });
      return;
    }

    updateArtifactOrgMutation.mutate({ id: editingOrgId, patToken: patTokenInput });
  };

  // Golden Repo Organization Mutations
  const createGoldenRepoOrgMutation = useMutation({
    mutationFn: async (data: typeof goldenRepoFormData) => {
      const response = await apiRequest("POST", "/api/golden-repo-organizations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golden-repo-organizations"] });
      setAddGoldenRepoDialogOpen(false);
      setGoldenRepoFormData({
        name: "",
        organizationUrl: "",
        projectName: "",
        repositoryName: "",
        apiVersion: "7.1",
        patToken: ""
      });
      toast({
        title: "Organization Added",
        description: "Golden Repo organization has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Organization",
        description: error.message || "Could not add organization",
        variant: "destructive",
      });
    },
  });

  const updateGoldenRepoOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof goldenRepoFormData> }) => {
      const response = await apiRequest("PUT", `/api/golden-repo-organizations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golden-repo-organizations"] });
      setEditGoldenRepoDialogOpen(false);
      setEditingGoldenRepoId(null);
      setGoldenRepoFormData({
        name: "",
        organizationUrl: "",
        projectName: "",
        repositoryName: "",
        apiVersion: "7.1",
        patToken: ""
      });
      toast({
        title: "Organization Updated",
        description: "Golden Repo organization has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Organization",
        description: error.message || "Could not update organization",
        variant: "destructive",
      });
    },
  });

  const deleteGoldenRepoOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/golden-repo-organizations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/golden-repo-organizations"] });
      toast({
        title: "Organization Removed",
        description: "Golden Repo organization has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Organization",
        description: error.message || "Could not remove organization",
        variant: "destructive",
      });
    },
  });

  // Golden Repo Handlers
  const handleAddGoldenRepo = () => {
    if (!goldenRepoFormData.name || !goldenRepoFormData.organizationUrl || !goldenRepoFormData.projectName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createGoldenRepoOrgMutation.mutate(goldenRepoFormData);
  };

  const handleEditGoldenRepo = (org: GoldenRepoOrganization) => {
    setEditingGoldenRepoId(org.id);
    setGoldenRepoFormData({
      name: org.name,
      organizationUrl: org.organizationUrl,
      projectName: org.projectName,
      repositoryName: org.repositoryName || "",
      apiVersion: org.apiVersion,
      patToken: ""
    });
    setEditGoldenRepoDialogOpen(true);
  };

  const handleUpdateGoldenRepo = () => {
    if (!editingGoldenRepoId) return;
    
    const updateData: any = {
      name: goldenRepoFormData.name,
      organizationUrl: goldenRepoFormData.organizationUrl,
      projectName: goldenRepoFormData.projectName,
      repositoryName: goldenRepoFormData.repositoryName,
      apiVersion: goldenRepoFormData.apiVersion,
    };

    if (goldenRepoFormData.patToken) {
      updateData.patToken = goldenRepoFormData.patToken;
    }

    updateGoldenRepoOrgMutation.mutate({ id: editingGoldenRepoId, data: updateData });
  };

  const handleDeleteGoldenRepo = (id: string) => {
    if (confirm("Are you sure you want to delete this organization?")) {
      deleteGoldenRepoOrgMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="heading-settings">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your application settings and integrations</p>
        </div>

        <Tabs defaultValue="central" className="w-full" data-testid="settings-tabs">
          <TabsList className="grid w-full grid-cols-2" data-testid="tabs-list">
            <TabsTrigger value="central" data-testid="tab-central">
              Client Settings
            </TabsTrigger>
            <TabsTrigger value="golden-repo" data-testid="tab-golden-repo">
              Golden Repository
            </TabsTrigger>
          </TabsList>

          {/* Golden Repository Settings Tab */}
          <TabsContent value="golden-repo" className="space-y-6">
            <Card data-testid="card-golden-repo-settings">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle data-testid="heading-golden-repo-settings">Golden Repository Organizations</CardTitle>
                    <CardDescription>
                      Manage your Azure DevOps organizations for golden repository templates
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setAddGoldenRepoDialogOpen(true)}
                    data-testid="button-add-golden-repo-org"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Organization
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {goldenRepoOrgs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p data-testid="text-no-organizations">No organizations configured</p>
                    <p className="text-sm mt-2">Add your first organization to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goldenRepoOrgs.map((org) => (
                      <Card key={org.id} className="hover-elevate" data-testid={`org-card-${org.id}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg" data-testid={`org-name-${org.id}`}>
                                  {org.name}
                                </h3>
                                {org.patConfigured ? (
                                  <Badge variant="default" data-testid={`org-pat-status-${org.id}`}>
                                    PAT Configured
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" data-testid={`org-pat-status-${org.id}`}>
                                    PAT Missing
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div data-testid={`org-url-${org.id}`}>
                                  <span className="font-medium">Organization:</span> {org.organizationUrl}
                                </div>
                                <div data-testid={`org-project-${org.id}`}>
                                  <span className="font-medium">Project:</span> {org.projectName}
                                </div>
                                <div data-testid={`org-api-version-${org.id}`}>
                                  <span className="font-medium">API Version:</span> {org.apiVersion}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditGoldenRepo(org)}
                                data-testid={`button-edit-org-${org.id}`}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteGoldenRepo(org.id)}
                                data-testid={`button-delete-org-${org.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Settings Tab - Used by SDLC, Conversational UI, Workflow, and Hub Artifacts */}
          <TabsContent value="central" className="space-y-6">
            {!isEncryptionAvailable && (
              <Alert variant="destructive" data-testid="alert-encryption-not-configured">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Encryption Key Required</AlertTitle>
                <AlertDescription>
                  The <code className="bg-muted px-1 py-0.5 rounded">PAT_ENCRYPTION_KEY</code> environment variable must be configured to use Client Settings. 
                  Please set this secret in your Replit environment (minimum 32 characters recommended).
                  After adding the secret, the application will restart automatically.
                </AlertDescription>
              </Alert>
            )}
            
            <Card data-testid="card-central-settings">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Client Settings</CardTitle>
                    <CardDescription>
                      Manage organization connections used by SDLC, Conversational UI, Workflow, and Hub Artifacts
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setAddOrgDialogOpen(true)}
                    size="sm"
                    disabled={!isEncryptionAvailable}
                    data-testid="button-add-organization"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {artifactsOrgs.map((org) => (
                    <Card key={org.id} className="border-2" data-testid={`org-card-${org.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{org.projectName}</CardTitle>
                            <CardDescription className="text-sm">
                              {org.organizationUrl}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOrganization(org.id)}
                            disabled={artifactsOrgs.length === 1}
                            data-testid={`button-remove-org-${org.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Project Name</Label>
                          <div className="text-sm text-muted-foreground" data-testid={`org-project-name-${org.id}`}>
                            {org.projectName}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Organization URL</Label>
                          <div className="text-sm text-muted-foreground" data-testid={`org-url-${org.id}`}>
                            {org.organizationUrl}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Personal Access Token</Label>
                          <div className="flex items-center gap-2">
                            <div className="text-sm flex-1" data-testid={`org-pat-status-${org.id}`}>
                              {org.patConfigured ? (
                                <span className="text-green-600 dark:text-green-400">✓ Configured</span>
                              ) : (
                                <span className="text-destructive">✗ Not configured</span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfigurePAT(org.id)}
                              data-testid={`button-configure-pat-${org.id}`}
                            >
                              {org.patConfigured ? 'Update PAT' : 'Configure PAT'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Click the button above to {org.patConfigured ? 'update' : 'configure'} the PAT token for this organization.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {artifactsOrgs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No organizations configured</p>
                      <p className="text-sm mt-2">Click "Add Organization" to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Configure PAT Dialog */}
        <Dialog open={configurePATDialogOpen} onOpenChange={setConfigurePATDialogOpen}>
          <DialogContent data-testid="dialog-configure-pat">
            <DialogHeader>
              <DialogTitle>Configure Personal Access Token</DialogTitle>
              <DialogDescription>
                Enter the PAT token for {artifactsOrgs.find(org => org.id === editingOrgId)?.projectName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pat-token">Personal Access Token</Label>
                <Input
                  id="pat-token"
                  type="password"
                  placeholder="Enter your Azure DevOps PAT token"
                  value={patTokenInput}
                  onChange={(e) => setPATTokenInput(e.target.value)}
                  data-testid="input-configure-pat"
                />
                <p className="text-xs text-muted-foreground">
                  This token will be securely stored and used to access artifacts from this organization.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfigurePATDialogOpen(false);
                    setEditingOrgId(null);
                    setPATTokenInput("");
                  }}
                  data-testid="button-cancel-configure-pat"
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePAT} data-testid="button-save-pat">
                  Save PAT Token
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Organization Dialog */}
        <Dialog open={addOrgDialogOpen} onOpenChange={setAddOrgDialogOpen}>
          <DialogContent data-testid="dialog-add-organization">
            <DialogHeader>
              <DialogTitle>Add Organization</DialogTitle>
              <DialogDescription>
                Add a new organization for artifacts management
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-org-project-name">Project Name <span className="text-destructive">*</span></Label>
                <Input
                  id="new-org-project-name"
                  placeholder="e.g., DevXPlatform"
                  value={newOrgData.projectName}
                  onChange={(e) => setNewOrgData({ ...newOrgData, projectName: e.target.value })}
                  data-testid="input-new-org-project-name"
                />
                <p className="text-xs text-muted-foreground">
                  The Azure DevOps project name for this organization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-org-url">Organization URL <span className="text-destructive">*</span></Label>
                <Input
                  id="new-org-url"
                  placeholder="https://dev.azure.com/YourOrg/"
                  value={newOrgData.organizationUrl}
                  onChange={(e) => setNewOrgData({ ...newOrgData, organizationUrl: e.target.value })}
                  data-testid="input-new-org-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-org-pat">Personal Access Token</Label>
                <Input
                  id="new-org-pat"
                  type="password"
                  placeholder="Enter your Azure DevOps PAT token"
                  value={newOrgData.patToken}
                  onChange={(e) => setNewOrgData({ ...newOrgData, patToken: e.target.value })}
                  data-testid="input-new-org-pat"
                />
                <p className="text-xs text-muted-foreground">
                  This token will be securely stored and used to access artifacts from this organization.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddOrgDialogOpen(false);
                    setNewOrgData({ projectName: "", organizationUrl: "", patToken: "" });
                  }}
                  data-testid="button-cancel-add-org"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddOrganization} data-testid="button-confirm-add-org">
                  Add Organization
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Golden Repo Organization Dialog */}
        <Dialog open={addGoldenRepoDialogOpen} onOpenChange={setAddGoldenRepoDialogOpen}>
          <DialogContent data-testid="dialog-add-golden-repo-org">
            <DialogHeader>
              <DialogTitle>Add Golden Repo Organization</DialogTitle>
              <DialogDescription>
                Add a new Azure DevOps organization for golden repository templates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="golden-repo-name">Organization Name</Label>
                <Input
                  id="golden-repo-name"
                  placeholder="e.g., NOUSBLR"
                  value={goldenRepoFormData.name}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, name: e.target.value })}
                  data-testid="input-golden-repo-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="golden-repo-url">Organization URL</Label>
                <Input
                  id="golden-repo-url"
                  placeholder="https://dev.azure.com/YourOrg"
                  value={goldenRepoFormData.organizationUrl}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, organizationUrl: e.target.value })}
                  data-testid="input-golden-repo-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="golden-repo-project">Project Name</Label>
                <Input
                  id="golden-repo-project"
                  placeholder="e.g., GSS-COC-DEVX-FOCUS"
                  value={goldenRepoFormData.projectName}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, projectName: e.target.value })}
                  data-testid="input-golden-repo-project"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="golden-repo-repository">Repository Name (Optional)</Label>
                <Input
                  id="golden-repo-repository"
                  placeholder="Leave empty for default"
                  value={goldenRepoFormData.repositoryName}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, repositoryName: e.target.value })}
                  data-testid="input-golden-repo-repository"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="golden-repo-api-version">API Version</Label>
                <Input
                  id="golden-repo-api-version"
                  placeholder="7.1"
                  value={goldenRepoFormData.apiVersion}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, apiVersion: e.target.value })}
                  data-testid="input-golden-repo-api-version"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="golden-repo-pat">Personal Access Token</Label>
                <Input
                  id="golden-repo-pat"
                  type="password"
                  placeholder="Enter your Azure DevOps PAT token"
                  value={goldenRepoFormData.patToken}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, patToken: e.target.value })}
                  data-testid="input-golden-repo-pat"
                />
                <p className="text-xs text-muted-foreground">
                  This token will be encrypted and securely stored.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddGoldenRepoDialogOpen(false);
                    setGoldenRepoFormData({
                      name: "",
                      organizationUrl: "",
                      projectName: "",
                      repositoryName: "",
                      apiVersion: "7.1",
                      patToken: ""
                    });
                  }}
                  data-testid="button-cancel-add-golden-repo-org"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddGoldenRepo} data-testid="button-confirm-add-golden-repo-org">
                  Add Organization
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Golden Repo Organization Dialog */}
        <Dialog open={editGoldenRepoDialogOpen} onOpenChange={setEditGoldenRepoDialogOpen}>
          <DialogContent data-testid="dialog-edit-golden-repo-org">
            <DialogHeader>
              <DialogTitle>Edit Golden Repo Organization</DialogTitle>
              <DialogDescription>
                Update organization settings for golden repository templates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-golden-repo-name">Organization Name</Label>
                <Input
                  id="edit-golden-repo-name"
                  placeholder="e.g., NOUSBLR"
                  value={goldenRepoFormData.name}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, name: e.target.value })}
                  data-testid="input-edit-golden-repo-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-golden-repo-url">Organization URL</Label>
                <Input
                  id="edit-golden-repo-url"
                  placeholder="https://dev.azure.com/YourOrg"
                  value={goldenRepoFormData.organizationUrl}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, organizationUrl: e.target.value })}
                  data-testid="input-edit-golden-repo-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-golden-repo-project">Project Name</Label>
                <Input
                  id="edit-golden-repo-project"
                  placeholder="e.g., GSS-COC-DEVX-FOCUS"
                  value={goldenRepoFormData.projectName}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, projectName: e.target.value })}
                  data-testid="input-edit-golden-repo-project"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-golden-repo-repository">Repository Name (Optional)</Label>
                <Input
                  id="edit-golden-repo-repository"
                  placeholder="Leave empty for default"
                  value={goldenRepoFormData.repositoryName}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, repositoryName: e.target.value })}
                  data-testid="input-edit-golden-repo-repository"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-golden-repo-api-version">API Version</Label>
                <Input
                  id="edit-golden-repo-api-version"
                  placeholder="7.1"
                  value={goldenRepoFormData.apiVersion}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, apiVersion: e.target.value })}
                  data-testid="input-edit-golden-repo-api-version"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-golden-repo-pat">Personal Access Token</Label>
                <Input
                  id="edit-golden-repo-pat"
                  type="password"
                  placeholder="Leave empty to keep current token"
                  value={goldenRepoFormData.patToken}
                  onChange={(e) => setGoldenRepoFormData({ ...goldenRepoFormData, patToken: e.target.value })}
                  data-testid="input-edit-golden-repo-pat"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the current PAT token. Enter a new token to update it.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditGoldenRepoDialogOpen(false);
                    setEditingGoldenRepoId(null);
                    setGoldenRepoFormData({
                      name: "",
                      organizationUrl: "",
                      projectName: "",
                      repositoryName: "",
                      apiVersion: "7.1",
                      patToken: ""
                    });
                  }}
                  data-testid="button-cancel-edit-golden-repo-org"
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateGoldenRepo} data-testid="button-confirm-edit-golden-repo-org">
                  Update Organization
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
