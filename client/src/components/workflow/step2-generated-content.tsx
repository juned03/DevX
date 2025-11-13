import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  Star,
  BookOpen,
  Sparkles,
  CheckCircle,
  X,
  Edit,
  Lightbulb,
  ClipboardCheck,
  PenTool,
  Code,
  TestTube,
  Rocket,
  FileCode,
} from "lucide-react";
import { useWorkflow } from "@/context/workflow-context";
import { UserStoryModal } from "./user-story-modal";
import { ArtifactEditDialog } from "./artifact-edit-dialog";
import { WikiEditDialog } from "./wiki-edit-dialog";
import type { UserStory, WikiPage, Epic, Feature } from "@shared/schema";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const priorityColors = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Medium: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const personaColors = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

const phaseConfig = {
  planning: {
    label: "Planning",
    icon: Lightbulb,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  requirements: {
    label: "Requirements",
    icon: ClipboardCheck,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  design: {
    label: "Design",
    icon: PenTool,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  implementation: {
    label: "Implementation",
    icon: Code,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  testing: {
    label: "Testing",
    icon: TestTube,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  deployment: {
    label: "Deployment",
    icon: Rocket,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
  reference: {
    label: "Reference",
    icon: FileCode,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-800",
  },
};

export function Step2GeneratedContent() {
  const { guidelines, epics, features, userStories, personas, setCurrentStep, requirement, sessionId, setWikiPages, setEpics, setFeatures, setUserStories } = useWorkflow();
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyFiltered, setShowOnlyFiltered] = useState(false);
  const [selectedWikiPage, setSelectedWikiPage] = useState<WikiPage | null>(null);
  
  // Edit dialog state
  const [editingArtifact, setEditingArtifact] = useState<Epic | Feature | UserStory | null>(null);
  const [editingArtifactType, setEditingArtifactType] = useState<"epic" | "feature" | "story" | null>(null);
  const [editingWikiPage, setEditingWikiPage] = useState<WikiPage | null>(null);

  // Fetch wiki pages for this session
  const { data: wikiData } = useQuery<{ pages: WikiPage[] }>({
    queryKey: ["/api/wiki/session", sessionId],
    enabled: !!sessionId,
  });

  const wikiPages = wikiData?.pages || [];

  // Update wiki pages in context when they're fetched (including empty arrays)
  useEffect(() => {
    if (wikiData?.pages) {
      setWikiPages(wikiData.pages);
    }
  }, [wikiData, setWikiPages]);

  // Generate wiki documentation mutation
  const generateWikiMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wiki/generate", {
        requirement,
        personas,
        epics,
        features,
        userStories,
        projectName: "SDLC Project",
        sessionId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wiki/session", sessionId] });
      toast.success("Wiki documentation generated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate Wiki: ${error.message}`);
    },
  });

  // Validation: check if required data is available
  const canGenerateWiki = requirement && requirement.trim().length > 0;

  // Edit handlers
  const handleEditEpic = (epic: Epic) => {
    setEditingArtifact(epic);
    setEditingArtifactType("epic");
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingArtifact(feature);
    setEditingArtifactType("feature");
  };

  const handleEditStory = (story: UserStory) => {
    setEditingArtifact(story);
    setEditingArtifactType("story");
  };

  const handleSaveArtifact = (updatedArtifact: Epic | Feature | UserStory) => {
    if (editingArtifactType === "epic") {
      setEpics(epics.map(e => e.id === updatedArtifact.id ? updatedArtifact as Epic : e));
      toast.success("Epic updated successfully");
    } else if (editingArtifactType === "feature") {
      setFeatures(features.map(f => f.id === updatedArtifact.id ? updatedArtifact as Feature : f));
      toast.success("Feature updated successfully");
    } else if (editingArtifactType === "story") {
      setUserStories(userStories.map(s => s.id === updatedArtifact.id ? updatedArtifact as UserStory : s));
      toast.success("User Story updated successfully");
    }
    setEditingArtifact(null);
    setEditingArtifactType(null);
  };

  const handleSaveWikiPage = (updatedPage: WikiPage) => {
    const updatedPages = wikiPages.map(p => p.id === updatedPage.id ? updatedPage : p);
    setWikiPages(updatedPages);
    toast.success("Wiki page updated successfully");
    setEditingWikiPage(null);
  };

  const toggleEpic = (id: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFeature = (id: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyGuidelines = () => {
    if (guidelines) {
      navigator.clipboard.writeText(guidelines);
      toast.success("Guidelines copied to clipboard");
    }
  };

  const downloadGuidelines = () => {
    if (guidelines) {
      const blob = new Blob([guidelines], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "design-guidelines.md";
      a.click();
      toast.success("Guidelines downloaded");
    }
  };

  const downloadWikiPage = async (page: WikiPage) => {
    try {
      // Call the API to convert markdown to .docx
      const response = await fetch(getApiUrl('/api/wiki/download-docx'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: page.content,
          title: page.title
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert to Word format');
      }

      // Get the .docx file as a blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${page.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${page.title}`);
    } catch (error) {
      console.error('Error downloading wiki page:', error);
      toast.error('Failed to download Wiki page');
    }
  };

  const downloadAllWiki = () => {
    if (wikiPages.length === 0) return;

    wikiPages.forEach((page) => {
      setTimeout(() => downloadWikiPage(page), 100 * wikiPages.indexOf(page));
    });
    toast.success(`Downloading ${wikiPages.length} Wiki pages`);
  };

  // Filter all artifacts based on search query
  const filteredEpics = searchQuery
    ? (epics || []).filter(
        (epic) =>
          epic.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          epic.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (epics || []);

  const filteredFeatures = searchQuery
    ? (features || []).filter(
        (feature) =>
          feature.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          feature.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (features || []);

  const filteredStories = searchQuery
    ? (userStories || []).filter(
        (story) =>
          story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.persona?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (userStories || []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Design Guidelines Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Design Guidelines
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyGuidelines}
                data-testid="button-copy-guidelines"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadGuidelines}
                data-testid="button-download-guidelines"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm">{guidelines}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Agile Artifacts Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Agile Artifacts</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search epics, features, or stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-stories"
              />
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-muted-foreground">
                Found: {filteredEpics.length} epic(s), {filteredFeatures.length} feature(s), {filteredStories.length} story/stories
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
            {/* Epics */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                EPICS ({filteredEpics.length}{searchQuery && ` of ${(epics || []).length}`})
              </h3>
              {filteredEpics.map((epic) => (
                <Card
                  key={epic.id}
                  className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800"
                  data-testid={`epic-${epic.id}`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleEpic(epic.id)}>
                        <h4 className="font-semibold">{epic.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {epic.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEpic(epic);
                          }}
                          data-testid={`button-edit-epic-${epic.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEpic(epic.id)}
                          data-testid={`button-toggle-epic-${epic.id}`}
                        >
                          {expandedEpics.has(epic.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={priorityColors[epic.priority]}>
                        {epic.priority}
                      </Badge>
                      <Badge variant="secondary">
                        {epic.featureCount} Features
                      </Badge>
                    </div>
                    {expandedEpics.has(epic.id) && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {(features || [])
                          .filter((f) => f.epicId === epic.id)
                          .map((feature) => (
                            <div
                              key={feature.id}
                              className="text-sm flex items-center gap-2"
                            >
                              <Star className="h-3 w-3 fill-blue-500 text-blue-500" />
                              <span className="font-medium">{feature.title}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                FEATURES ({filteredFeatures.length}{searchQuery && ` of ${(features || []).length}`})
              </h3>
              {filteredFeatures.map((feature) => (
                <Card
                  key={feature.id}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800"
                  data-testid={`feature-${feature.id}`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleFeature(feature.id)}>
                        <h4 className="font-semibold">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditFeature(feature);
                          }}
                          data-testid={`button-edit-feature-${feature.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeature(feature.id)}
                          data-testid={`button-toggle-feature-${feature.id}`}
                        >
                          {expandedFeatures.has(feature.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={priorityColors[feature.priority]}>
                        {feature.priority}
                      </Badge>
                      <Badge variant="secondary">
                        {feature.storyCount} Stories
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* User Stories */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                USER STORIES ({filteredStories.length})
              </h3>
              <div className="grid gap-3">
                {filteredStories.map((story) => {
                  const persona = (personas || []).find((p) => p.id === story.personaId);
                  if (!persona) return null;

                  return (
                    <Card
                      key={story.id}
                      className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 cursor-pointer hover-elevate active-elevate-2"
                      onClick={() => setSelectedStory(story)}
                      data-testid={`story-${story.id}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={
                                personaColors[
                                  persona.color as keyof typeof personaColors
                                ]
                              }
                            >
                              {persona.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{story.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {story.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStory(story);
                            }}
                            data-testid={`button-edit-story-${story.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{persona.role}</Badge>
                          <Badge className={priorityColors[story.priority]}>
                            {story.priority}
                          </Badge>
                          <Badge variant="secondary">{story.storyPoints} pts</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wiki Documentation Section */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <div>
              <CardTitle className="text-lg">Wiki Documentation</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive SDLC documentation organized by project phases
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {wikiPages.length === 0 ? (
              <Button
                onClick={() => generateWikiMutation.mutate()}
                disabled={generateWikiMutation.isPending || !canGenerateWiki}
                data-testid="button-generate-wiki"
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {generateWikiMutation.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Wiki ({33} Docs)
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAllWiki}
                data-testid="button-download-all-wiki"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All ({wikiPages.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {wikiPages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">
                Click "Generate Wiki" to create comprehensive SDLC documentation
              </p>
              <p className="text-xs mt-2">
                Includes: Feasibility Study, SRS, Architecture, Diagrams, Test Plans, and 25+ more documents
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-8 w-full mb-4">
                <TabsTrigger value="all" className="text-xs">
                  All ({wikiPages.length})
                </TabsTrigger>
                {Object.entries(phaseConfig).map(([phase, config]) => {
                  const PhaseIcon = config.icon;
                  const count = wikiPages.filter(p => p.phase === phase).length;
                  return (
                    <TabsTrigger key={phase} value={phase} className="text-xs">
                      <PhaseIcon className={`h-3 w-3 mr-1 ${config.color}`} />
                      {config.label} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="space-y-6">
                  {Object.entries(phaseConfig).map(([phase, config]) => {
                    const phaseDocs = wikiPages.filter(p => p.phase === phase).sort((a, b) => (a.order || 0) - (b.order || 0));
                    if (phaseDocs.length === 0) return null;
                    
                    const PhaseIcon = config.icon;
                    
                    return (
                      <div key={phase} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <PhaseIcon className={`h-5 w-5 ${config.color}`} />
                          <h3 className="font-semibold text-sm uppercase tracking-wide">
                            {config.label} ({phaseDocs.length})
                          </h3>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {phaseDocs.map((page) => (
                            <Card
                              key={page.id}
                              className={`hover-elevate active-elevate-2 cursor-pointer ${config.bgColor} ${config.borderColor}`}
                              onClick={() => setSelectedWikiPage(page)}
                              data-testid={`wiki-page-${page.pageType}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className={`h-4 w-4 ${config.color}`} />
                                      <h4 className="font-semibold text-sm">{page.title}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {page.content.substring(0, 100)}...
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingWikiPage(page);
                                      }}
                                      data-testid={`button-edit-wiki-${page.pageType}`}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadWikiPage(page);
                                      }}
                                      data-testid={`button-download-wiki-${page.pageType}`}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {page.pageType}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    #{page.order}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {Object.entries(phaseConfig).map(([phase, config]) => {
                const phaseDocs = wikiPages.filter(p => p.phase === phase).sort((a, b) => (a.order || 0) - (b.order || 0));
                const PhaseIcon = config.icon;
                
                return (
                  <TabsContent key={phase} value={phase} className="mt-0">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {phaseDocs.map((page) => (
                        <Card
                          key={page.id}
                          className={`hover-elevate active-elevate-2 cursor-pointer ${config.bgColor} ${config.borderColor}`}
                          onClick={() => setSelectedWikiPage(page)}
                          data-testid={`wiki-page-${page.pageType}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className={`h-4 w-4 ${config.color}`} />
                                  <h4 className="font-semibold text-sm">{page.title}</h4>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {page.content.substring(0, 100)}...
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWikiPage(page);
                                  }}
                                  data-testid={`button-edit-wiki-${page.pageType}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadWikiPage(page);
                                  }}
                                  data-testid={`button-download-wiki-${page.pageType}`}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {page.pageType}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                #{page.order}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setCurrentStep(3)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
          data-testid="button-proceed-devops"
        >
          Proceed to DevOps Push
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {selectedStory && (personas || []).find((p) => p.id === selectedStory.personaId) && (
        <UserStoryModal
          story={selectedStory}
          persona={(personas || []).find((p) => p.id === selectedStory.personaId)!}
          open={!!selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}

      {/* Artifact Edit Dialog */}
      <ArtifactEditDialog
        open={!!editingArtifact}
        onOpenChange={(open) => {
          if (!open) {
            setEditingArtifact(null);
            setEditingArtifactType(null);
          }
        }}
        artifact={editingArtifact}
        artifactType={editingArtifactType || "epic"}
        onSave={handleSaveArtifact}
      />

      {/* Wiki Edit Dialog */}
      <WikiEditDialog
        open={!!editingWikiPage}
        onOpenChange={(open) => {
          if (!open) {
            setEditingWikiPage(null);
          }
        }}
        wikiPage={editingWikiPage}
        onSave={handleSaveWikiPage}
      />

      {/* Wiki Page Modal */}
      <Dialog open={!!selectedWikiPage} onOpenChange={(open) => !open && setSelectedWikiPage(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {selectedWikiPage?.title}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedWikiPage) {
                      navigator.clipboard.writeText(selectedWikiPage.content);
                      toast.success("Content copied to clipboard");
                    }
                  }}
                  data-testid="button-copy-wiki-content"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedWikiPage) {
                      downloadWikiPage(selectedWikiPage);
                    }
                  }}
                  data-testid="button-download-wiki-modal"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            {selectedWikiPage && (
              <Badge variant="secondary" className="w-fit">
                {selectedWikiPage.pageType}
              </Badge>
            )}
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
              {selectedWikiPage?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
