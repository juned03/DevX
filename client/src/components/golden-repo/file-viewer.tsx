import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Copy, Check, FileCode } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileViewerProps {
  file: {
    path: string;
    name: string;
    content: string;
    language: string;
    size: number;
  } | null;
  isLoading: boolean;
}

export function FileViewer({ file, isLoading }: FileViewerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b">
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!file) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center space-y-4 py-12">
          <div className="inline-flex p-6 rounded-full bg-muted">
            <FileCode className="h-16 w-16 text-muted-foreground" />
          </div>
          <div>
            <h3
              className="text-lg font-semibold"
              data-testid="text-no-file-title"
            >
              Select a file to preview
            </h3>
            <p
              className="text-sm text-muted-foreground mt-2"
              data-testid="text-no-file-subtitle"
            >
              Click on any file in the tree to view its contents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: `File content has been copied`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const filename = file.path?.split("/").pop() || file.name || "file.txt";

    // Best-effort MIME type based on extension to help browsers keep the name
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      js: "text/javascript",
      jsx: "text/javascript",
      ts: "text/plain",
      tsx: "text/plain",
      json: "application/json",
      md: "text/markdown",
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      yml: "text/yaml",
      yaml: "text/yaml",
      xml: "application/xml",
      java: "text/plain",
      py: "text/plain",
      rb: "text/plain",
      go: "text/plain",
      rs: "text/plain",
      cs: "text/plain",
      c: "text/plain",
      cpp: "text/plain",
    };
    const mimeType = (ext && mimeMap[ext]) || "text/plain";

    const blob = new Blob([file.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: `Downloading ${filename}`,
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b space-y-0 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold truncate"
              data-testid="text-file-name"
            >
              {file.name}
            </h3>
            <p
              className="text-xs text-muted-foreground truncate mt-1"
              data-testid="text-file-path"
            >
              {file.path}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              {file.language}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(file.size)}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopy}
              data-testid="button-copy-content"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDownload}
              data-testid="button-download-file"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-auto">
        <SyntaxHighlighter
          language={file.language}
          style={oneDark}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: "1.5rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
            borderRadius: 0,
            height: "100%",
          }}
          data-testid="code-viewer"
        >
          {file.content}
        </SyntaxHighlighter>
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
