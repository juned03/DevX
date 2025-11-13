import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WikiPage } from "@shared/schema";
import { BookOpen, Copy, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { getApiUrl } from "@/lib/api-config";

interface WikiPageModalProps {
  wikiPage: WikiPage;
  open: boolean;
  onClose: () => void;
}

export function WikiPageModal({ wikiPage, open, onClose }: WikiPageModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(wikiPage.content);
    toast.success("Content copied to clipboard");
  };

  const handleDownload = async () => {
    try {
      // Call the API to convert markdown to .docx
      const response = await fetch(getApiUrl('/api/wiki/download-docx'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: wikiPage.content,
          title: wikiPage.title
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
      a.download = `${wikiPage.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${wikiPage.title}`);
    } catch (error) {
      console.error('Error downloading wiki page:', error);
      toast.error('Failed to download Wiki page');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              {wikiPage.title}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                data-testid="button-copy-wiki-content-modal"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                data-testid="button-download-wiki-modal"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit mt-2">
            {wikiPage.pageType}
          </Badge>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                {wikiPage.content}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="markdown" className="flex-1 overflow-y-auto mt-4">
            <div className="font-mono text-xs bg-muted p-4 rounded-md">
              <pre className="whitespace-pre-wrap">{wikiPage.content}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
