import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronRight, ChevronDown, FileText, Folder, Search, X, AlertCircle, Eye } from "lucide-react";
import { useSDLCProject } from "@/context/sdlc-project-context";
import { useWorkflow, type ComplianceGuideline } from "@/context/workflow-context";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";

interface FileTreeNode {
  name: string;
  path: string;
  type: "folder" | "file";
  size?: number;
  children?: FileTreeNode[];
}

interface ComplianceGuidelinesModalProps {
  open: boolean;
  onClose: () => void;
}

export function ComplianceGuidelinesModal({ open, onClose }: ComplianceGuidelinesModalProps) {
  const { projectConfig } = useSDLCProject();
  const { setComplianceGuidelines } = useWorkflow();
  const { toast } = useToast();

  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Map<string, FileTreeNode>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ node: FileTreeNode; content: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch repository tree on mount
  useEffect(() => {
    if (open && projectConfig) {
      fetchRepositoryTree();
    }
  }, [open, projectConfig]);

  const fetchRepositoryTree = async () => {
    if (!projectConfig) {
      setError("Please select a Golden Repository first");
      return;
    }

    setIsLoadingTree(true);
    setError(null);

    try {
      const response = await fetch(
        getApiUrl(`/api/ado/repository/${projectConfig.repositoryId}/tree`),
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid PAT token");
        } else if (response.status === 404) {
          throw new Error("Repository not found");
        } else if (response.status === 403) {
          throw new Error("PAT token needs Code (Read) permission");
        }
        throw new Error("Failed to load repository");
      }

      const data = await response.json();
      setTree(data.tree || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load repository. Please try again";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTree(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleFileSelection = (node: FileTreeNode) => {
    setSelectedFiles(prev => {
      const next = new Map(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.set(node.path, node);
      }
      return next;
    });
  };

  const removeSelectedFile = (path: string) => {
    setSelectedFiles(prev => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
  };

  const handlePreviewFile = async (node: FileTreeNode) => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch(
        getApiUrl(`/api/ado/repository/${projectConfig!.repositoryId}/file?path=${encodeURIComponent(node.path)}`),
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${node.name}`);
      }

      const data = await response.json();
      setPreviewFile({ node, content: data.content || "" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load preview";
      toast({
        title: "Preview Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleApplyGuidelines = async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one guideline file",
        variant: "destructive",
      });
      return;
    }

    // Validate file count and size limits
    if (selectedFiles.size > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files can be selected",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingContent(true);
    setError(null);

    try {
      const guidelines: ComplianceGuideline[] = [];
      let totalSize = 0;

      const filesArray = Array.from(selectedFiles);
      for (const [path, node] of filesArray) {
        try {
          const response = await fetch(
            getApiUrl(`/api/ado/repository/${projectConfig!.repositoryId}/file?path=${encodeURIComponent(path)}`),
            {
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ${node.name}`);
          }

          const data = await response.json();
          const content = data.content || "";

          // Check individual file size (500KB max)
          const fileSize = new Blob([content]).size;
          if (fileSize > 500 * 1024) {
            throw new Error(`File ${node.name} exceeds 500KB limit`);
          }

          totalSize += fileSize;

          // Check total size (2MB max)
          if (totalSize > 2 * 1024 * 1024) {
            throw new Error("Total file size exceeds 2MB limit");
          }

          guidelines.push({
            id: path,
            name: node.name,
            path: path,
            content: content,
          });
        } catch (err) {
          console.error(`Error fetching file ${path}:`, err);
          throw err;
        }
      }

      setComplianceGuidelines(guidelines);

      toast({
        title: "Guidelines Applied",
        description: `${guidelines.length} compliance guideline${guidelines.length > 1 ? 's' : ''} have been applied`,
      });

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch file contents";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetchingContent(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const renderTreeNode = (node: FileTreeNode, level: number = 0): JSX.Element | null => {
    const isMarkdown = node.type === "file" && node.name.toLowerCase().endsWith(".md");
    const isFolder = node.type === "folder";
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFiles.has(node.path);

    // Apply search filter
    const matchesSearch = !searchQuery || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch && !isFolder) {
      return null;
    }

    // Only show markdown files and folders
    if (!isMarkdown && !isFolder) {
      return null;
    }

    const hasMatchingChildren = isFolder && node.children?.some(child => 
      renderTreeNode(child, level + 1) !== null
    );

    if (!matchesSearch && !hasMatchingChildren) {
      return null;
    }

    return (
      <div key={node.path} className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-2 hover-elevate rounded-md cursor-pointer ${
            isSelected ? "bg-primary/10" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else if (isMarkdown) {
              toggleFileSelection(node);
            }
          }}
          data-testid={isFolder ? `folder-${node.name}` : `file-${node.name}`}
        >
          {isFolder && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
          {!isFolder && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleFileSelection(node)}
              onClick={(e) => e.stopPropagation()}
              data-testid={`checkbox-file-${node.name}`}
            />
          )}
          {isFolder ? (
            <Folder className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm flex-1">{node.name}</span>
          {node.size && node.size > 0 && (
            <span className="text-xs text-muted-foreground">
              {(node.size / 1024).toFixed(1)} KB
            </span>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[80vh]" data-testid="dialog-compliance-guidelines">
        <DialogHeader>
          <DialogTitle>Select Compliance Guidelines</DialogTitle>
          <DialogDescription>
            Select markdown files from your Golden Repository to use as compliance guidelines for artifact generation
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-[400px]">
          {/* Left Panel: Repository Tree */}
          <div className="border rounded-lg flex flex-col">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-files"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 p-2">
              {isLoadingTree ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tree.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No markdown files found
                </div>
              ) : (
                <div className="space-y-1">
                  {tree.map(node => renderTreeNode(node))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel: Selected Files */}
          <div className="border rounded-lg flex flex-col">
            <div className="p-3 border-b">
              <h3 className="font-medium text-sm">
                Selected Files ({selectedFiles.size})
              </h3>
            </div>

            <ScrollArea className="flex-1 p-2">
              {selectedFiles.size === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No files selected
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from(selectedFiles).map(([path, node]) => (
                    <div
                      key={path}
                      className="flex items-center gap-2 p-2 border rounded-md bg-card hover-elevate"
                      data-testid={`selected-file-${node.name}`}
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{node.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{path}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handlePreviewFile(node)}
                        data-testid={`button-preview-${node.name}`}
                        title="Preview content"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeSelectedFile(path)}
                        data-testid={`button-remove-${node.name}`}
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedFiles.size > 0 && (
              <div className="p-3 border-t text-xs text-muted-foreground">
                Maximum 10 files, 500KB each, 2MB total
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isFetchingContent}
            data-testid="button-skip-guidelines"
          >
            Skip
          </Button>
          <Button
            onClick={handleApplyGuidelines}
            disabled={selectedFiles.size === 0 || isFetchingContent}
            data-testid="button-apply-guidelines"
          >
            {isFetchingContent ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching Content...
              </>
            ) : (
              `Apply Guidelines (${selectedFiles.size})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(isOpen) => !isOpen && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-preview-guideline">
          <DialogHeader>
            <DialogTitle>Preview: {previewFile?.node.name}</DialogTitle>
            <DialogDescription>{previewFile?.node.path}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[60vh] border rounded-lg p-4">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewFile ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{previewFile.content}</ReactMarkdown>
              </div>
            ) : null}
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewFile(null)}
              data-testid="button-close-preview"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
