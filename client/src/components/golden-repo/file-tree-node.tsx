import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  FileJson,
  FileImage,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTreeNodeProps {
  node: {
    name: string;
    type: "file" | "folder";
    path: string;
    children?: any[];
    size?: number;
  };
  onFileSelect: (path: string) => void;
  selectedPath: string | null;
  searchQuery?: string;
  level?: number;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "py":
    case "java":
    case "cpp":
    case "c":
    case "cs":
    case "go":
    case "rs":
    case "rb":
    case "php":
      return <FileCode className="h-4 w-4 text-blue-500" />;
    case "json":
    case "yaml":
    case "yml":
    case "xml":
      return <FileJson className="h-4 w-4 text-amber-500" />;
    case "md":
    case "txt":
    case "doc":
    case "docx":
      return <FileText className="h-4 w-4 text-gray-500" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return <FileImage className="h-4 w-4 text-emerald-500" />;
    default:
      return <File className="h-4 w-4 text-gray-400" />;
  }
};

export function FileTreeNode({
  node,
  onFileSelect,
  selectedPath,
  searchQuery = "",
  level = 0,
}: FileTreeNodeProps) {
  // Helper function to check if any child matches search
  const checkChildrenMatch = (childNode: any): boolean => {
    if (childNode.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    if (childNode.children) {
      return childNode.children.some((c: any) => checkChildrenMatch(c));
    }
    return false;
  };

  // Filter logic for search
  const shouldShow = () => {
    if (!searchQuery) return true;

    const matchesSearch = node.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (matchesSearch) return true;

    // Check if any children match
    if (node.children) {
      return node.children.some(
        (child: any) =>
          child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (child.children && checkChildrenMatch(child))
      );
    }

    return false;
  };

  // Auto-expand based on search query or if we're at root level
  const shouldAutoExpand = () => {
    if (level === 0) return true;
    if (!searchQuery) return false;

    // Expand if this folder or any descendant matches the search
    if (node.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return true;
    if (node.children) {
      return node.children.some((child: any) => checkChildrenMatch(child));
    }
    return false;
  };

  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand());

  // Update expansion state when search query changes
  useEffect(() => {
    if (searchQuery) {
      setIsExpanded(shouldAutoExpand());
    } else if (level > 0) {
      // Collapse non-root nodes when search is cleared
      setIsExpanded(false);
    }
  }, [searchQuery]);

  if (!shouldShow()) return null;

  // Debug logging for root level folders
  if (level === 0 && node.type === "folder") {
    console.log(
      `📁 Rendering root folder: ${
        node.name
      }, expanded: ${isExpanded}, children: ${node.children?.length || 0}`
    );
  }

  const handleToggle = () => {
    if (node.type === "folder") {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  const isSelected = selectedPath === node.path;
  const highlightMatch =
    searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-md hover-elevate active-elevate-2",
          isSelected && "bg-primary/10 text-primary font-medium",
          highlightMatch && "bg-amber-50 dark:bg-amber-950/20"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
        data-testid={`tree-node-${node.type}-${node.path}`}
      >
        {node.type === "folder" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="text-sm truncate flex-1">
          {searchQuery && highlightMatch ? (
            <HighlightedText text={node.name} highlight={searchQuery} />
          ) : (
            node.name
          )}
        </span>
        {node.type === "file" && typeof node.size === "number" && (
          <span className="text-xs text-muted-foreground ml-auto">
            {formatFileSize(node.size)}
          </span>
        )}
      </div>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child: any) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
              searchQuery={searchQuery}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightedText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark
            key={index}
            className="bg-amber-300 dark:bg-amber-700 text-foreground"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
