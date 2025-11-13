import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FileTreeNode } from "@/components/golden-repo/file-tree-node";
import { FileViewer } from "@/components/golden-repo/file-viewer";
import { Search, X, FolderGit2, ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-config";

export default function GoldenRepoPreview() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const repoId = params.get("repoId") || "default";
  const { toast } = useToast();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch repository file tree from Azure DevOps
  const { data: repositoryData, isLoading: isRepositoryLoading } = useQuery({
    queryKey: ["/api/ado/repository", repoId, "tree"],
    queryFn: async () => {
      const response = await fetch(getApiUrl(`/api/ado/repository/${repoId}/tree`), {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch file tree");
      const data = await response.json();
      return data;
    },
  });

  const isEmptyRepository = repositoryData?.isEmpty || false;
  const emptyRepositoryMessage = repositoryData?.message || "This repository is empty";
  
  const repositoryTree = repositoryData ? {
    name: "root",
    path: "/",
    type: "folder" as const,
    children: repositoryData.tree || []
  } : null;

  // Fetch file content from Azure DevOps
  const { data: fileContent, isLoading: isFileLoading } = useQuery({
    queryKey: ["/api/ado/repository", repoId, "file", selectedPath],
    queryFn: async () => {
      if (!selectedPath) return null;

      const response = await fetch(
        getApiUrl(`/api/ado/repository/${repoId}/file?path=${encodeURIComponent(selectedPath)}`),
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch file content");
      return response.json();
    },
    enabled: !!selectedPath,
  });

  // Auto-select README.md on initial load
  useEffect(() => {
    if (repositoryTree && !selectedPath) {
      const findReadme = (node: any): string | null => {
        if (node.type === "file" && node.name.toLowerCase() === "readme.md") {
          return node.path;
        }
        if (node.children) {
          for (const child of node.children) {
            const result = findReadme(child);
            if (result) return result;
          }
        }
        return null;
      };

      const readmePath = findReadme(repositoryTree);
      if (readmePath) {
        setSelectedPath(readmePath);
      }
    }
  }, [repositoryTree, selectedPath]);

  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      console.log("Downloading repository:", repoId);
      
      const response = await fetch(getApiUrl(`/api/ado/repository/${repoId}/download`), {
        credentials: "include",
      });

      console.log("Download response status:", response.status, response.statusText);
      console.log("Download response headers:", {
        contentType: response.headers.get("content-type"),
        contentDisposition: response.headers.get("content-disposition"),
        contentLength: response.headers.get("content-length"),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Download failed with status:", response.status, errorText);
        throw new Error(`Failed to download repository: ${response.status} ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "repository.zip";
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
        title: "Download started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/golden-repos">
              <Button variant="ghost" size="sm" data-testid="button-back-to-repos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Repositories
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="inline-flex p-2 rounded-lg bg-primary/10">
                <FolderGit2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" data-testid="heading-preview-title">
                  Repository Preview
                </h1>
                <p className="text-sm text-muted-foreground">
                  Browse and explore repository files
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              data-testid="button-download-repo"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download ZIP"}
            </Button>
            <Badge variant="secondary" data-testid="badge-read-only">
              Read-Only Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <div className="w-96 border-r bg-card flex flex-col">
          {/* Header */}
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Repository Files</h2>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
                data-testid="input-search-files"
              />
              {searchQuery && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleClearSearch}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* File Tree */}
          <div className="flex-1 overflow-auto p-2">
            {isRepositoryLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : repositoryTree ? (
              <div data-testid="file-tree-repository">
                {repositoryTree.children && repositoryTree.children.length > 0 ? (
                  repositoryTree.children.map((child: any) => (
                    <FileTreeNode
                      key={child.path}
                      node={child}
                      onFileSelect={handleFileSelect}
                      selectedPath={selectedPath}
                      searchQuery={searchQuery}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 px-4">
                    <div className="inline-flex p-3 rounded-full bg-muted mb-3">
                      <FolderGit2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {isEmptyRepository ? "Empty Repository" : "No Files Found"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isEmptyRepository ? emptyRepositoryMessage : "This repository doesn't contain any files yet"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Failed to load repository files</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              {repositoryTree?.children?.length || 0} items in repository
            </p>
          </div>
        </div>

        {/* Right Panel - File Viewer */}
        <div className="flex-1 overflow-hidden p-6">
          <FileViewer file={fileContent} isLoading={isFileLoading} />
        </div>
      </div>
    </div>
  );
}
