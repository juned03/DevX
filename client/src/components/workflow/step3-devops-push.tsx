import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Cloud,
  Settings,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useWorkflow } from "@/context/workflow-context";
import toast from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserStoryModal } from "./user-story-modal";
import { EpicModal } from "./epic-modal";
import { FeatureModal } from "./feature-modal";
import { WikiPageModal } from "./wiki-page-modal";
import type { UserStory, Epic, Feature, WikiPage } from "@shared/schema";

export function Step3DevOpsPush() {
  const {
    azureConfig,
    setAzureConfig,
    epics,
    features,
    userStories,
    personas,
    wikiPages,
    selectedEpics,
    selectedFeatures,
    selectedStories,
    selectedWikiPages,
    toggleEpic,
    toggleFeature,
    toggleStory,
    toggleWikiPage,
    selectAll,
    deselectAll,
    isPushing,
    setIsPushing,
    setStep3Complete,
  } = useWorkflow();

  const [configOpen, setConfigOpen] = useState(true);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [devopsUrl, setDevopsUrl] = useState("");
  const [wikiUrl, setWikiUrl] = useState("");
  const [wikiPagesCount, setWikiPagesCount] = useState(0);
  const [workItemsCount, setWorkItemsCount] = useState(0);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedWikiPage, setSelectedWikiPage] = useState<WikiPage | null>(null);

  const totalSelected =
    selectedEpics.size + selectedFeatures.size + selectedStories.size + selectedWikiPages.size;

  const handlePush = async () => {
    if (totalSelected === 0) {
      toast.error("Please select at least one item to push");
      return;
    }

    if (!azureConfig.pat) {
      toast.error("Please provide a Personal Access Token");
      return;
    }

    setIsPushing(true);
    setPushSuccess(false);

    try {
      const selectedItems = [
        ...Array.from(selectedEpics).map((id) => ({ type: "epic", id })),
        ...Array.from(selectedFeatures).map((id) => ({ type: "feature", id })),
        ...Array.from(selectedStories).map((id) => ({ type: "story", id })),
        ...Array.from(selectedWikiPages).map((id) => ({ type: "wiki", id })),
      ];

      const res = await apiRequest("POST", "/api/workflow/push-devops", {
        config: azureConfig,
        selectedItems,
        epics,
        features,
        userStories,
        personas,
        wikiPages,
      });
      const responseData = await res.json();

      if (responseData.success) {
        setPushSuccess(true);
        setDevopsUrl(responseData.url);
        setWikiUrl(responseData.wikiUrl || "");
        setWikiPagesCount(responseData.wikiPagesCreated || 0);
        setWorkItemsCount(responseData.workItemIds?.length || 0);
        setStep3Complete(true);
        
        // Save ADO configuration to settings for future reference
        try {
          const settingsRes = await apiRequest("GET", "/api/ado-settings");
          const settingsData = await settingsRes.json();
          
          const configData = {
            organizationUrl: azureConfig.organization,
            projectName: azureConfig.project,
            repository: azureConfig.repository,
            branch: azureConfig.branch,
            patToken: azureConfig.pat,
            apiVersion: "7.0",
          };
          
          if (settingsData.id) {
            // Update existing settings
            await apiRequest("PUT", `/api/ado-settings/${settingsData.id}`, configData);
          } else {
            // Create new settings
            await apiRequest("POST", "/api/ado-settings", configData);
          }
        } catch (settingsError) {
          console.error("Failed to save ADO settings:", settingsError);
          // Don't show error to user - this is a background operation
        }
        
        const successMsg = [];
        if (responseData.workItemIds?.length > 0) {
          successMsg.push(`${responseData.workItemIds.length} work items`);
        }
        if (responseData.wikiPagesCreated > 0) {
          successMsg.push(`${responseData.wikiPagesCreated} wiki pages`);
        }
        
        toast.success(
          `Successfully pushed ${successMsg.join(' and ')} to Azure DevOps!`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error("DevOps push error:", error);
      toast.error("Failed to push to Azure DevOps. Please check your configuration.");
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Configuration Panel */}
      <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Azure DevOps Configuration
              </CardTitle>
              {configOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={azureConfig.organization}
                  onChange={(e) =>
                    setAzureConfig({ ...azureConfig, organization: e.target.value })
                  }
                  data-testid="input-organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={azureConfig.project}
                  onChange={(e) =>
                    setAzureConfig({ ...azureConfig, project: e.target.value })
                  }
                  data-testid="input-project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repository">Repository</Label>
                <Input
                  id="repository"
                  value={azureConfig.repository}
                  onChange={(e) =>
                    setAzureConfig({ ...azureConfig, repository: e.target.value })
                  }
                  data-testid="input-repository"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={azureConfig.branch}
                  onChange={(e) =>
                    setAzureConfig({ ...azureConfig, branch: e.target.value })
                  }
                  data-testid="input-branch"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="pat">Personal Access Token (PAT)</Label>
                <Input
                  id="pat"
                  type="password"
                  placeholder="Enter your Azure DevOps PAT"
                  value={azureConfig.pat || ""}
                  onChange={(e) =>
                    setAzureConfig({ ...azureConfig, pat: e.target.value })
                  }
                  data-testid="input-pat"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Selection Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Items to Push</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                data-testid="button-select-all"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                data-testid="button-deselect-all"
              >
                Deselect All
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary">
              {selectedEpics.size} Epics
            </Badge>
            <Badge variant="secondary">
              {selectedFeatures.size} Features
            </Badge>
            <Badge variant="secondary">
              {selectedStories.size} Stories
            </Badge>
            <Badge variant="secondary">
              {selectedWikiPages.size} Wiki Pages
            </Badge>
            <Badge variant="default">
              Total: {totalSelected}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[400px] overflow-y-auto">
          {/* Epics Selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Epics</h3>
            {epics.map((epic) => (
              <div
                key={epic.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                onClick={() => setSelectedEpic(epic)}
              >
                <Checkbox
                  checked={selectedEpics.has(epic.id)}
                  onCheckedChange={() => toggleEpic(epic.id)}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`checkbox-epic-${epic.id}`}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{epic.title}</p>
                  <p className="text-xs text-muted-foreground">{epic.description}</p>
                </div>
                <Badge variant="outline">{epic.priority}</Badge>
              </div>
            ))}
          </div>

          {/* Features Selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Features</h3>
            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                onClick={() => setSelectedFeature(feature)}
              >
                <Checkbox
                  checked={selectedFeatures.has(feature.id)}
                  onCheckedChange={() => toggleFeature(feature.id)}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`checkbox-feature-${feature.id}`}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <Badge variant="outline">{feature.priority}</Badge>
              </div>
            ))}
          </div>

          {/* User Stories Selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">User Stories</h3>
            {userStories.map((story) => (
              <div
                key={story.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                onClick={() => setSelectedStory(story)}
              >
                <Checkbox
                  checked={selectedStories.has(story.id)}
                  onCheckedChange={(checked) => {
                    toggleStory(story.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`checkbox-story-${story.id}`}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{story.title}</p>
                  <p className="text-xs text-muted-foreground">{story.persona}</p>
                </div>
                <Badge variant="outline">{story.storyPoints} pts</Badge>
              </div>
            ))}
          </div>

          {/* Wiki Pages Selection */}
          {wikiPages.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Wiki Documentation</h3>
              {wikiPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover-elevate cursor-pointer"
                  onClick={() => setSelectedWikiPage(page)}
                >
                  <Checkbox
                    checked={selectedWikiPages.has(page.id)}
                    onCheckedChange={() => toggleWikiPage(page.id)}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`checkbox-wiki-${page.id}`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{page.title}</p>
                    <p className="text-xs text-muted-foreground">{page.pageType}</p>
                  </div>
                  <Badge variant="outline">Wiki</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Button */}
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handlePush}
          disabled={isPushing || totalSelected === 0 || pushSuccess}
          size="lg"
          className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
          data-testid="button-push-devops"
        >
          {isPushing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Pushing to Azure DevOps...
            </>
          ) : pushSuccess ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Successfully Pushed!
            </>
          ) : (
            <>
              <Cloud className="h-5 w-5 mr-2" />
              Push to Azure DevOps ({totalSelected} items)
            </>
          )}
        </Button>

        {pushSuccess && devopsUrl && (
          <Card className="w-full bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-semibold">Push Successful!</h3>
              <p className="text-sm text-muted-foreground">
                {workItemsCount > 0 && wikiPagesCount > 0
                  ? `${workItemsCount} work items and ${wikiPagesCount} wiki pages have been created in Azure DevOps`
                  : workItemsCount > 0
                  ? `${workItemsCount} work items have been created in Azure DevOps`
                  : `${wikiPagesCount} wiki pages have been created in Azure DevOps`}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {workItemsCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(devopsUrl, "_blank")}
                    data-testid="button-view-devops"
                  >
                    View Work Items
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {wikiPagesCount > 0 && wikiUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(wikiUrl, "_blank")}
                    data-testid="button-view-wiki"
                  >
                    View Wiki Pages
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Story Detail Modal */}
      {selectedStory && personas && personas.find((p) => p.id === selectedStory.personaId) && (
        <UserStoryModal
          story={selectedStory}
          persona={personas.find((p) => p.id === selectedStory.personaId)!}
          open={!!selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}

      {/* Epic Detail Modal */}
      {selectedEpic && (
        <EpicModal
          epic={selectedEpic}
          open={!!selectedEpic}
          onClose={() => setSelectedEpic(null)}
        />
      )}

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <FeatureModal
          feature={selectedFeature}
          open={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}

      {/* Wiki Page Detail Modal */}
      {selectedWikiPage && (
        <WikiPageModal
          wikiPage={selectedWikiPage}
          open={!!selectedWikiPage}
          onClose={() => setSelectedWikiPage(null)}
        />
      )}
    </div>
  );
}
